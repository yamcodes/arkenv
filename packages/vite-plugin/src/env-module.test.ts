import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArkEnvError } from "@arkenv/core";
import * as vite from "vite";
import { afterEach, describe, expect, it } from "vitest";
import {
	classifyEnvKeys,
	generateClientEnvModule,
	isEnvModuleId,
	isTransformModeCall,
} from "./env-module.js";
import arkenvPlugin from "./index.js";

describe("transform mode helpers", () => {
	it("detects transform-mode calls", () => {
		expect(isTransformModeCall(undefined, undefined)).toBe(true);
		expect(isTransformModeCall({ schemaPath: "src/env.ts" }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({ clientPrefix: "PUBLIC_" }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({}, undefined)).toBe(true);
		expect(isTransformModeCall({ VITE_FOO: "string" }, undefined)).toBe(false);
		expect(isTransformModeCall({ VITE_FOO: "string" }, { coerce: true })).toBe(
			false,
		);
	});

	it("classifies flat-layout keys by client prefix", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				VITE_API_URL: "string",
				NODE_ENV: "'development' | 'production'",
			});
		`;
		const keys = classifyEnvKeys(content, ["VITE_"]);
		expect(keys.clientKeys).toContain("VITE_API_URL");
		expect(keys.sharedKeys).toContain("NODE_ENV");
		expect(keys.serverKeys).toContain("DATABASE_URL");
	});

	it("generates inlined literals and throwing server-key getters", () => {
		const code = generateClientEnvModule(
			{ VITE_API_URL: "https://api.example.com", VITE_PORT: 8080 },
			["DATABASE_URL"],
		);

		expect(code).toContain('"VITE_API_URL": "https://api.example.com"');
		expect(code).toContain('"VITE_PORT": 8080');
		expect(code).toContain('get ["DATABASE_URL"]()');
		expect(code).toContain(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(code).not.toContain("error.name");
		expect(code).not.toContain("ArkEnvAccessError");
		expect(code).not.toContain("ArkEnv Error:");
		expect(code).not.toMatch(/import\b.*ArkEnvError/);
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

	it("rewrites the env module in the client graph with coerced literals", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const outDir = mkdtempSync(join(tmpdir(), "arkenv-vite-transform-"));
		temps.push(outDir);

		await vite.build({
			mode: "test",
			configFile: false,
			root: fixtureDir,
			plugins: [arkenvPlugin({ schemaPath: "env.ts" })],
			logLevel: "error",
			build: {
				outDir,
				write: true,
				lib: {
					entry: "index.ts",
					formats: ["es"],
					fileName: () => "bundle.js",
				},
				rollupOptions: {
					external: [],
				},
			},
		});

		const bundle = readFileSync(join(outDir, "bundle.js"), "utf8");

		expect(bundle).toContain("https://fixture.example.com");
		expect(bundle).toContain("8080");
		expect(bundle).toContain("VITE_DEBUG");
		expect(bundle).toContain(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(bundle).not.toMatch(/\.name\s*=\s*"ArkEnvAccessError"/);
		expect(bundle).not.toContain("ArkEnv Error:");
		expect(bundle).not.toMatch(/from ["']@arkenv\/core["']/);
		expect(bundle).not.toMatch(/from ["']arktype["']/);
		expect(bundle).not.toContain("postgres://fixture:5432/db");
	});

	it("throws when a server-only key is read from the transformed client module", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const outDir = mkdtempSync(join(tmpdir(), "arkenv-vite-transform-throw-"));
		temps.push(outDir);

		await vite.build({
			mode: "test",
			configFile: false,
			root: fixtureDir,
			plugins: [arkenvPlugin()],
			logLevel: "error",
			build: {
				outDir,
				write: true,
				lib: {
					entry: "index.ts",
					formats: ["es"],
					fileName: () => "bundle.js",
				},
			},
		});

		const bundlePath = join(outDir, "bundle.js");
		const mod = await import(
			/* @vite-ignore */ `${bundlePath}?t=${Date.now()}`
		);
		expect(mod.config.apiUrl).toBe("https://fixture.example.com");
		expect(mod.config.debug).toBe(true);
		expect(mod.config.port).toBe(8080);
		try {
			mod.readServerSecret();
			expect.fail("Expected boundary access error");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect(error).not.toBeInstanceOf(ArkEnvError);
			expect((error as Error).name).toBe("Error");
			expect((error as Error).message).toBe(
				"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
			expect(String(error)).toBe(
				"Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
		}
	});

	it("passes through the env module unchanged in the SSR graph", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const plugin = arkenvPlugin({ schemaPath: join(fixtureDir, "env.ts") });

		const mockContext = {
			meta: {
				framework: "vite",
				version: "1.0.0",
				rollupVersion: "4.0.0",
				viteVersion: "5.0.0",
			},
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
		} as any;

		if (plugin.config && typeof plugin.config === "function") {
			plugin.config.call(
				mockContext,
				{ root: fixtureDir, envDir: fixtureDir },
				{ mode: "test", command: "build" },
			);
		}
		if (plugin.configResolved && typeof plugin.configResolved === "function") {
			await plugin.configResolved.call(mockContext, {
				root: fixtureDir,
				envDir: fixtureDir,
				envPrefix: "VITE_",
			} as any);
		}

		const original = readFileSync(join(fixtureDir, "env.ts"), "utf8");
		let result: any = null;
		if (plugin.transform && typeof plugin.transform === "function") {
			result = await plugin.transform.call(
				mockContext,
				original,
				join(fixtureDir, "env.ts"),
				{ ssr: true } as any,
			);
		}
		expect(result).toBeNull();
	});

	it("rejects the schema/define path", () => {
		expect(() =>
			(arkenvPlugin as (a?: unknown) => unknown)({ VITE_TEST: "string" }),
		).toThrow(/schema\/define plugin API was removed/);
	});

	it("resolves schemaPath relative to the project root", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const plugin = arkenvPlugin({ schemaPath: "env.ts" });

		const mockContext = {
			meta: {
				framework: "vite",
				version: "1.0.0",
				rollupVersion: "4.0.0",
				viteVersion: "5.0.0",
			},
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
		} as any;

		if (plugin.config && typeof plugin.config === "function") {
			plugin.config.call(
				mockContext,
				{ root: fixtureDir, envDir: fixtureDir },
				{ mode: "test", command: "build" },
			);
		}
		if (plugin.configResolved && typeof plugin.configResolved === "function") {
			await plugin.configResolved.call(mockContext, {
				root: fixtureDir,
				envDir: fixtureDir,
				envPrefix: "VITE_",
			} as any);
		}

		let result: any = null;
		if (plugin.transform && typeof plugin.transform === "function") {
			result = await plugin.transform.call(
				mockContext,
				"export const env = {}",
				join(fixtureDir, "env.ts"),
				{ ssr: false } as any,
			);
		}

		expect(result?.code).toContain("VITE_API_URL");
		expect(result?.code).toContain('get ["DATABASE_URL"]()');
		expect(result?.code).not.toContain("@arkenv/core");
	});
});

describe("missing-schema errors", () => {
	const temps: string[] = [];

	afterEach(() => {
		for (const dir of temps.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("throws a short discovery error without an env.ts starter", async () => {
		const { resolveEnvModulePath } = await import("./env-module.js");
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-missing-schema-"));
		temps.push(root);

		let message = "";
		try {
			resolveEnvModulePath(root);
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}

		expect(message).toMatch(/Could not find schema file/);
		expect(message).toMatch(/npx arkenv@latest init/);
		expect(message).toMatch(/Checked paths:/);
		expect(message).not.toMatch(/Example `src\/env\.ts`/);
		expect(message).not.toMatch(/```/);
		expect(message).not.toMatch(/import \{ type \} from "arktype"/);
		expect(message).not.toMatch(/from "zod"/);
	});

	it("rejects a discovered strict layout directory", async () => {
		const { resolveEnvModulePath } = await import("./env-module.js");
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-strict-dir-"));
		temps.push(root);
		const envDir = join(root, "env");
		mkdirSync(envDir, { recursive: true });
		writeFileSync(join(envDir, "client.ts"), "export const env = {}");
		writeFileSync(join(envDir, "server.ts"), "export const env = {}");

		expect(() => resolveEnvModulePath(root)).toThrow(
			/only supports a flat env module file/,
		);
	});
});
