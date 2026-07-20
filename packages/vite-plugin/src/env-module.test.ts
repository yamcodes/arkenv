import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
		expect(isTransformModeCall({}, undefined)).toBe(false);
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
			"Attempted to access server environment variable 'DATABASE_URL' on the client",
		);
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
		expect(() => mod.readServerSecret()).toThrow(
			/Attempted to access server environment variable 'DATABASE_URL' on the client/,
		);
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

	it("keeps SPA define mode working alongside transform helpers", async () => {
		const plugin = arkenvPlugin({ VITE_TEST: "string" });
		expect(plugin).toHaveProperty("config");
		expect(plugin).not.toHaveProperty("transform");
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
