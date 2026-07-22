import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	classifyEnvKeys,
	generateClientEnvModule,
	isEnvModuleId,
	isTransformModeCall,
} from "./env-module.js";
import { arkenv, hybrid } from "./plugin.js";

describe("transform mode helpers", () => {
	it("detects transform-mode calls", () => {
		expect(isTransformModeCall(undefined, undefined)).toBe(true);
		expect(isTransformModeCall({ schemaPath: "src/env.ts" }, undefined)).toBe(
			true,
		);
		expect(
			isTransformModeCall({ clientPrefix: "BUN_PUBLIC_" }, undefined),
		).toBe(true);
		expect(isTransformModeCall({}, undefined)).toBe(false);
		expect(isTransformModeCall({ BUN_PUBLIC_FOO: "string" }, undefined)).toBe(
			false,
		);
		expect(
			isTransformModeCall({ BUN_PUBLIC_FOO: "string" }, { coerce: true }),
		).toBe(false);
	});

	it("classifies flat-layout keys by client prefix", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				BUN_PUBLIC_API_URL: "string",
				NODE_ENV: "'development' | 'production'",
			});
		`;
		const keys = classifyEnvKeys(content, ["BUN_PUBLIC_"]);
		expect(keys.clientKeys).toContain("BUN_PUBLIC_API_URL");
		expect(keys.sharedKeys).toContain("NODE_ENV");
		expect(keys.serverKeys).toContain("DATABASE_URL");
	});

	it("generates inlined literals and throwing server-key getters", () => {
		const code = generateClientEnvModule(
			{ BUN_PUBLIC_API_URL: "https://api.example.com", BUN_PUBLIC_PORT: 8080 },
			["DATABASE_URL"],
		);

		expect(code).toContain('"BUN_PUBLIC_API_URL": "https://api.example.com"');
		expect(code).toContain('"BUN_PUBLIC_PORT": 8080');
		expect(code).toContain('get ["DATABASE_URL"]()');
		expect(code).toContain(
			"Attempted to access server environment variable 'DATABASE_URL' on the client",
		);
		expect(code).not.toContain("arkenv");
		expect(code).not.toContain("arktype");
	});

	it("matches env module ids with query suffixes", () => {
		const schemaPath = "/proj/src/env.ts";
		expect(isEnvModuleId("/proj/src/env.ts", schemaPath)).toBe(true);
		expect(isEnvModuleId("/proj/src/env.ts?t=123", schemaPath)).toBe(true);
		expect(isEnvModuleId("/proj/src/other.ts", schemaPath)).toBe(false);
	});
});

describe("transform mode plugin", () => {
	const temps: string[] = [];

	afterEach(() => {
		for (const dir of temps.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns a browser-targeted plugin for transform calls", () => {
		const plugin = arkenv();
		expect(plugin).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(plugin).toHaveProperty("target", "browser");
		expect(plugin).toHaveProperty("setup");
		expect(typeof plugin.setup).toBe("function");
	});

	it("exposes hybrid as a zero-config browser transform plugin", () => {
		expect(hybrid).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(hybrid).toHaveProperty("target", "browser");
		expect(hybrid).toHaveProperty("setup");
	});

	it("keeps schema/SPA path working alongside transform helpers", () => {
		process.env.BUN_PUBLIC_TEST = "test-value";
		const plugin = arkenv({ BUN_PUBLIC_TEST: "string" });
		expect(plugin).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(plugin).not.toHaveProperty("target");
		expect(plugin).toHaveProperty("setup");
		delete process.env.BUN_PUBLIC_TEST;
	});

	it("rewrites the env module via onLoad with coerced literals", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const previous = { ...process.env };
		Object.assign(process.env, {
			BUN_PUBLIC_API_URL: "https://fixture.example.com",
			BUN_PUBLIC_DEBUG: "true",
			BUN_PUBLIC_PORT: "8080",
			DATABASE_URL: "postgres://fixture:5432/db",
			NODE_ENV: "test",
		});

		try {
			const plugin = arkenv({ schemaPath: join(fixtureDir, "env.ts") });

			let onStart: (() => void | Promise<void>) | undefined;
			let onLoad:
				| ((args: {
						path: string;
				  }) =>
						| { contents?: string; loader?: string }
						| undefined
						| Promise<{ contents?: string; loader?: string } | undefined>)
				| undefined;

			const mockBuild = {
				onStart(cb: () => void | Promise<void>) {
					onStart = cb;
				},
				onLoad(
					_opts: { filter: RegExp },
					cb: typeof onLoad extends infer T ? T : never,
				) {
					onLoad = cb;
				},
			};

			plugin.setup(mockBuild as any);
			await onStart?.();

			const result = await onLoad?.({
				path: join(fixtureDir, "env.ts"),
			});
			expect(result?.contents).toBeDefined();
			const code = result?.contents ?? "";

			expect(code).toContain("https://fixture.example.com");
			expect(code).toContain("8080");
			expect(code).toContain("BUN_PUBLIC_DEBUG");
			expect(code).toContain(
				"Attempted to access server environment variable 'DATABASE_URL' on the client",
			);
			expect(code).not.toContain("@arkenv/core");
			expect(code).not.toContain("arktype");
			expect(code).not.toContain("postgres://fixture:5432/db");
		} finally {
			process.env = previous;
		}
	});

	it("does not rewrite non-env modules", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const previous = { ...process.env };
		Object.assign(process.env, {
			BUN_PUBLIC_API_URL: "https://fixture.example.com",
			BUN_PUBLIC_DEBUG: "true",
			BUN_PUBLIC_PORT: "8080",
			DATABASE_URL: "postgres://fixture:5432/db",
			NODE_ENV: "test",
		});

		try {
			const plugin = arkenv({ schemaPath: join(fixtureDir, "env.ts") });
			let onStart: (() => void | Promise<void>) | undefined;
			let onLoad:
				| ((args: {
						path: string;
				  }) =>
						| { contents?: string }
						| undefined
						| Promise<{ contents?: string } | undefined>)
				| undefined;

			plugin.setup({
				onStart(cb: () => void | Promise<void>) {
					onStart = cb;
				},
				onLoad(_opts: { filter: RegExp }, cb: NonNullable<typeof onLoad>) {
					onLoad = cb;
				},
			} as any);

			await onStart?.();
			const result = await onLoad?.({
				path: join(fixtureDir, "index.ts"),
			});
			expect(result).toBeUndefined();
		} finally {
			process.env = previous;
		}
	});

	it("throws when a server-only key is read from the transformed module", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const previous = { ...process.env };
		Object.assign(process.env, {
			BUN_PUBLIC_API_URL: "https://fixture.example.com",
			BUN_PUBLIC_DEBUG: "true",
			BUN_PUBLIC_PORT: "8080",
			DATABASE_URL: "postgres://fixture:5432/db",
			NODE_ENV: "test",
		});

		try {
			const plugin = arkenv({ schemaPath: join(fixtureDir, "env.ts") });
			let onStart: (() => void | Promise<void>) | undefined;
			let onLoad:
				| ((args: {
						path: string;
				  }) =>
						| { contents?: string }
						| undefined
						| Promise<{ contents?: string } | undefined>)
				| undefined;

			plugin.setup({
				onStart(cb: () => void | Promise<void>) {
					onStart = cb;
				},
				onLoad(_opts: { filter: RegExp }, cb: NonNullable<typeof onLoad>) {
					onLoad = cb;
				},
			} as any);

			await onStart?.();
			const result = await onLoad?.({
				path: join(fixtureDir, "env.ts"),
			});
			expect(result?.contents).toBeDefined();

			const outDir = mkdtempSync(join(tmpdir(), "arkenv-bun-transform-"));
			temps.push(outDir);
			const outFile = join(outDir, "env.mjs");
			writeFileSync(outFile, result?.contents ?? "");

			const mod = await import(`${outFile}?t=${Date.now()}`);
			expect(mod.env.BUN_PUBLIC_API_URL).toBe("https://fixture.example.com");
			expect(mod.env.BUN_PUBLIC_DEBUG).toBe(true);
			expect(mod.env.BUN_PUBLIC_PORT).toBe(8080);
			expect(() => mod.env.DATABASE_URL).toThrow(
				/Attempted to access server environment variable 'DATABASE_URL' on the client/,
			);
		} finally {
			process.env = previous;
		}
	});

	it("fails fast when required env is missing at transform setup", async () => {
		const previous = { ...process.env };
		delete process.env.BUN_PUBLIC_API_URL;
		delete process.env.DATABASE_URL;

		const strictDir = mkdtempSync(join(tmpdir(), "arkenv-bun-strict-"));
		temps.push(strictDir);
		writeFileSync(
			join(strictDir, "env.ts"),
			`import arkenv from "@arkenv/core";
export const env = arkenv({
  DATABASE_URL: "string",
  BUN_PUBLIC_API_URL: "string",
});
export default env;
`,
		);

		try {
			const plugin = arkenv({ schemaPath: join(strictDir, "env.ts") });
			let onStart: (() => void | Promise<void>) | undefined;
			plugin.setup({
				onStart(cb: () => void | Promise<void>) {
					onStart = cb;
				},
				onLoad() {},
			} as any);

			await expect(Promise.resolve().then(() => onStart?.())).rejects.toThrow();
		} finally {
			process.env = previous;
		}
	});
});

describe("SPA mode regression", () => {
	it("still rewrites process.env for schema calls", () => {
		process.env.BUN_PUBLIC_TEST = "test-value";
		const plugin = arkenv({ BUN_PUBLIC_TEST: "string" });
		expect(plugin.target).toBeUndefined();
		delete process.env.BUN_PUBLIC_TEST;
	});
});
