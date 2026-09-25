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
		expect(
			isTransformModeCall({ env: { VITE_FOO: "override" } }, undefined),
		).toBe(false);
		expect(isTransformModeCall({ coerce: true }, undefined)).toBe(false);
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

	it("fails during config resolution when the environment is invalid", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-invalid-startup-"));
		temps.push(root);
		writeFileSync(
			join(root, "env.ts"),
			'import arkenv from "@arkenv/core";\n\nexport const env = arkenv({ REQUIRED_TOKEN: "string" });\n',
		);
		const plugin = arkenvPlugin() as any;
		const context = {} as any;

		if (plugin.config && typeof plugin.config === "function") {
			plugin.config.call(
				context,
				{ root, envDir: root },
				{ mode: "test", command: "serve" },
			);
		}

		await expect(
			Promise.resolve().then(() =>
				plugin.configResolved?.call(context, {
					root,
					envDir: root,
					envPrefix: "VITE_",
				} as any),
			),
		).rejects.toMatchObject({ name: "ArkEnvError" });
		expect(process.env.REQUIRED_TOKEN).toBeUndefined();
	});

	it("revalidates valid schema and dotenv changes during HMR", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-hmr-"));
		temps.push(root);
		const schemaPath = join(root, "env.ts");
		const dotenvPath = join(root, ".env.test");
		writeFileSync(
			schemaPath,
			'import arkenv from "@arkenv/core";\n\nexport const env = arkenv({ VITE_API_URL: "string" });\n',
		);
		writeFileSync(dotenvPath, "VITE_API_URL=https://example.com\n");
		const plugin = arkenvPlugin({ schemaPath }) as any;
		const server = {
			moduleGraph: {
				getModulesByFile: () => new Set([{ id: schemaPath }]),
				invalidateModule: () => {},
			},
		} as any;
		const context = {} as any;

		plugin.config?.call(
			context,
			{ root, envDir: root },
			{ mode: "test", command: "serve" },
		);
		await plugin.configResolved?.call(context, {
			root,
			envDir: root,
			envPrefix: "VITE_",
		} as any);

		const schemaUpdate = plugin.handleHotUpdate?.call(context, {
			file: schemaPath,
			server,
		} as any);
		expect(schemaUpdate).toHaveLength(1);
		writeFileSync(dotenvPath, "VITE_API_URL=https://updated.example.com\n");
		const dotenvUpdate = plugin.handleHotUpdate?.call(context, {
			file: dotenvPath,
			server,
		} as any);
		expect(dotenvUpdate).toHaveLength(1);

		const clientModule = await plugin.transform?.call(
			{
				environment: {
					name: "client",
					config: { consumer: "client" },
				},
			},
			"export const env = {}",
			schemaPath,
		);
		expect(clientModule?.code).toContain(
			'"VITE_API_URL": "https://updated.example.com"',
		);
	});

	it("propagates invalid dotenv values during HMR", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-invalid-hmr-"));
		temps.push(root);
		const schemaPath = join(root, "env.ts");
		const dotenvPath = join(root, ".env.test");
		writeFileSync(
			schemaPath,
			'import arkenv from "@arkenv/core";\n\nexport const env = arkenv({ VITE_PORT: "number" });\n',
		);
		writeFileSync(dotenvPath, "VITE_PORT=8080\n");
		const plugin = arkenvPlugin({ schemaPath }) as any;
		const server = {
			moduleGraph: {
				getModulesByFile: () => new Set(),
				invalidateModule: () => {},
			},
		} as any;
		const context = {} as any;

		plugin.config?.call(
			context,
			{ root, envDir: root },
			{ mode: "test", command: "serve" },
		);
		await plugin.configResolved?.call(context, {
			root,
			envDir: root,
			envPrefix: "VITE_",
		} as any);
		writeFileSync(dotenvPath, "VITE_PORT=not-a-number\n");

		await expect(
			Promise.resolve().then(() =>
				plugin.handleHotUpdate?.call(context, {
					file: dotenvPath,
					server,
				} as any),
			),
		).rejects.toMatchObject({ name: "ArkEnvError" });
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

	it("passes through the env module in Vite 6 server environments", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const plugin = arkenvPlugin({ schemaPath: join(fixtureDir, "env.ts") });

		const mockContext = {
			meta: {
				framework: "vite",
				version: "1.0.0",
				rollupVersion: "4.0.0",
				viteVersion: "6.0.0",
			},
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
			environment: {
				name: "ssr",
				config: { consumer: "server" },
			},
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
			);
		}
		expect(result).toBeNull();
	});

	it("passes through the env module for custom server-consumer environments", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const plugin = arkenvPlugin({ schemaPath: join(fixtureDir, "env.ts") });

		const mockContext = {
			meta: {
				framework: "vite",
				version: "1.0.0",
				rollupVersion: "4.0.0",
				viteVersion: "6.0.0",
			},
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
			environment: {
				name: "cloudflare-workers",
				config: { consumer: "server" },
			},
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
			);
		}
		expect(result).toBeNull();
	});

	it("rewrites the env module in Vite 6 client environments", async () => {
		const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
		const plugin = arkenvPlugin({ schemaPath: join(fixtureDir, "env.ts") });

		const mockContext = {
			meta: {
				framework: "vite",
				version: "1.0.0",
				rollupVersion: "4.0.0",
				viteVersion: "6.0.0",
			},
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
			environment: {
				name: "client",
				config: { consumer: "client" },
			},
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
			);
		}

		expect(result?.code).toContain("VITE_API_URL");
		expect(result?.code).toContain('get ["DATABASE_URL"]()');
		expect(result?.code).not.toContain("@arkenv/core");
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
		expect(message).toMatch(/npx arkenv init/);
		expect(message).toMatch(/Checked paths:/);
		expect(message).not.toMatch(/Example `src\/env\.ts`/);
		expect(message).not.toMatch(/```/);
		expect(message).not.toMatch(/import \{ type \} from "arktype"/);
		expect(message).not.toMatch(/from "zod"/);
	});

	it("rejects a schema directory instead of discovering strict layout", async () => {
		const { resolveEnvModulePath } = await import("./env-module.js");
		const root = mkdtempSync(join(tmpdir(), "arkenv-vite-schema-dir-"));
		temps.push(root);
		const envDir = join(root, "env");
		mkdirSync(envDir, { recursive: true });
		writeFileSync(join(envDir, "client.ts"), "export const env = {}");
		writeFileSync(join(envDir, "server.ts"), "export const env = {}");

		expect(() => resolveEnvModulePath(root)).toThrow(
			/Could not find schema file/,
		);
		expect(() => resolveEnvModulePath(root, "env")).toThrow(
			/only supports a flat env module file/,
		);
	});
});
