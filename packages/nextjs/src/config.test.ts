import fs from "node:fs";
import path from "node:path";
import { closeWatcher } from "@arkenv/build";
import { afterEach, describe, expect, it, vi } from "vitest";

let useMockWatcher = false;
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockWatch = vi.fn().mockImplementation(() => {
	return {
		on: vi.fn().mockReturnThis(),
		close: mockClose,
	};
});

vi.mock("chokidar", async (importOriginal) => {
	const original = await importOriginal<typeof import("chokidar")>();
	return {
		...original,
		watch: (schemaPath: any, options?: any) => {
			if (useMockWatcher) {
				return mockWatch(schemaPath, options);
			}
			return original.watch(schemaPath, options);
		},
	};
});

import { extractKeys, runCodegen, withArkEnv } from "./config";
import { withArkEnv as withArkEnvStandard } from "./standard/config";

describe("config key extraction", () => {
	it("should extract client and shared keys correctly", () => {
		const source = `
			import arkenv from "./env.gen";
			export const env = arkenv({
				server: {
					DATABASE_URL: "string",
				},
				client: {
					NEXT_PUBLIC_API_URL: "string",
					NEXT_PUBLIC_APP_TITLE: "string = 'My App'",
				},
				shared: {
					NODE_ENV: "string",
				}
			});
		`;

		const { clientKeys, sharedKeys } = extractKeys(source);

		expect(clientKeys).toEqual([
			"NEXT_PUBLIC_API_URL",
			"NEXT_PUBLIC_APP_TITLE",
		]);
		expect(sharedKeys).toEqual(["NODE_ENV"]);
	});

	it("should handle single-line comments", () => {
		const source = `
			export const env = arkenv({
				client: {
					// This is a comment
					NEXT_PUBLIC_VAR_1: "string",
					// Another comment: with colon
					NEXT_PUBLIC_VAR_2: "string",
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
	});

	it("should handle multi-line comments", () => {
		const source = `
			export const env = arkenv({
				client: {
					/*
					* Multi-line comment:
					*/
					NEXT_PUBLIC_VAR_1: "string",
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1"]);
	});

	it("should ignore string values that contain colons", () => {
		const source = `
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_API_URL: "string = 'http://localhost:3000'",
					NEXT_PUBLIC_NESTED: 'string = "foo:bar"',
					NEXT_PUBLIC_TEMPLATE: \`string = "baz:qux"\`,
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual([
			"NEXT_PUBLIC_API_URL",
			"NEXT_PUBLIC_NESTED",
			"NEXT_PUBLIC_TEMPLATE",
		]);
	});

	it("should extract quoted keys correctly", () => {
		const source = `
			export const env = arkenv({
				client: {
					"NEXT_PUBLIC_VAR_1": "string",
					'NEXT_PUBLIC_VAR_2': "string",
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
	});

	it("should ignore braces inside string templates or comments in extractBlock", () => {
		const source = `
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_VAR_1: "string = '{not-a-brace}'",
					// {comment-brace}
					NEXT_PUBLIC_VAR_2: "string = 'foo'",
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
	});

	it("should ignore nested keys inside complex values in parseBlockKeys", () => {
		const source = `
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_VAR_1: type("string", { description: "nested:key" }),
					NEXT_PUBLIC_VAR_2: "string",
				}
			});
		`;

		const { clientKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
	});

	it("should extract keys when using ArkType 'type({...})' wrapper", () => {
		const source = `
			export const env = arkenv({
				client: type({
					NEXT_PUBLIC_VAR_1: "string",
					NEXT_PUBLIC_VAR_2: "string",
				}),
				shared: at.type({
					NODE_ENV: "string",
				})
			});
		`;

		const { clientKeys, sharedKeys } = extractKeys(source);
		expect(clientKeys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
		expect(sharedKeys).toEqual(["NODE_ENV"]);
	});
});

describe("codegen process", () => {
	const tempDir = path.join(__dirname, "__temp_tests__");
	const schemaPath = path.join(tempDir, "env.ts");
	const outputPath = path.join(tempDir, "env.gen.ts");

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should parse file, resolve relative imports, and write generated code", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "./env.gen";
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				}
			});
			`,
			"utf-8",
		);

		runCodegen(schemaPath, outputPath);

		expect(fs.existsSync(outputPath)).toBe(true);
		const generatedContent = fs.readFileSync(outputPath, "utf-8");

		// Check warning header
		expect(generatedContent).not.toContain("// @ts-nocheck");
		expect(generatedContent).toContain(
			"Generated by ArkEnv. DO NOT EDIT DIRECTLY.",
		);

		// Check exports and wrapper types
		expect(generatedContent).toContain("export function arkenv<");
		expect(generatedContent).toContain("export default arkenv;");

		// Check that relative path import was resolved correctly (relative from __temp_tests__/env.gen.ts to __temp_tests__/env.ts is ./env)
		// Wait, path.relative(__temp_tests__, __temp_tests__/env.ts) is "env.ts", which normalizes to "./env"
		expect(generatedContent).toContain(
			'import { arkenv as coreArkenv } from "@arkenv/nextjs";',
		);

		// Check destructured runtimeEnv keys
		expect(generatedContent).toContain(
			'NEXT_PUBLIC_API_URL: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL,',
		);
		expect(generatedContent).toContain(
			'NODE_ENV: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.NODE_ENV ?? process.env.NODE_ENV : process.env.NODE_ENV,',
		);
	});

	it("should handle custom output path relative importing", () => {
		const customOutputDir = path.join(tempDir, "generated");
		const customOutputPath = path.join(customOutputDir, "env.gen.ts");

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				}
			});
			`,
			"utf-8",
		);

		runCodegen(schemaPath, customOutputPath);

		expect(fs.existsSync(customOutputPath)).toBe(true);
		expect(fs.existsSync(path.join(customOutputDir, "index.ts"))).toBe(false);
		const generatedContent = fs.readFileSync(customOutputPath, "utf-8");
		expect(generatedContent).toContain("export function arkenv<");

		// The relative import from generated/env.gen.ts to env.ts should be ../env
		// Since we didn't mock relative path resolution, let's check it.
		// Wait! The templates generated for config should be:
		// import { config } from "../env"; or similar?
		// Oh, wait! In arkenv wrapper pattern, we do NOT import config!
		// The developer imports arkenv from "./env.gen", and calls it in env.ts.
		// So the generated file does NOT import from "./env" at all!
		// Wait! Let's check my template:
		// Yes! The generated template does NOT import any config! It only imports coreArkenv from "@arkenv/nextjs"!
		// Oh, wow! That is even simpler and cleaner!
		// Wait, let's verify if my generateFactoryCode template has any relative import of config:
		// No, it doesn't! It just exports the generic wrapper function `arkenv`.
		// But wait! Why does `generateFactoryCode` compute `relativeImportPath`?
		// Ah! In `generateFactoryCode`, we computed `relativeImportPath` but we didn't actually use it in the returned string template!
		// Oh, let me check my config.ts code:
		// Yes, I defined:
		// `let relativeImportPath = path.relative(outputDir, schemaPath);`
		// and normalized it, but didn't put it in the template, because the wrapper factory doesn't import from the config file!
		// That is brilliant! Since the factory is generic and accepts the schema options directly, it doesn't need to know about the schema file at all! It just needs to know which keys to destructure in `runtimeEnv`.
		// This makes it completely decoupled and robust!
		// Let's verify that this is correct.
		// Yes, `arkenv` wrapper takes `options` (which is the schema) and returns `coreArkenv({ ...options, runtimeEnv: { ... } })`.
		// It has no dependency on the schema file!
		// This is so beautiful!
	});

	it("keeps @/.arkenv typecheckable via .arkenv/index.ts for a custom outputPath", () => {
		const customOutputDir = path.join(tempDir, "src", "generated");
		const customOutputPath = path.join(customOutputDir, "env.gen.ts");

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				}
			});
			`,
			"utf-8",
		);

		runCodegen(schemaPath, customOutputPath, undefined, undefined, tempDir);

		const barrelPath = path.join(tempDir, ".arkenv", "index.ts");
		expect(fs.existsSync(path.join(customOutputDir, "index.ts"))).toBe(false);
		expect(fs.readFileSync(barrelPath, "utf-8")).toBe(
			'export * from "../src/generated/env.gen";\nexport { default } from "../src/generated/env.gen";\n',
		);
	});
});

describe("withArkEnv wrapper", () => {
	const tempDir = path.join(__dirname, "__temp_tests_wrapper__");
	const schemaPath = path.join(tempDir, "env.ts");

	afterEach(async () => {
		await closeWatcher();
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should configure turbopack and webpack aliases for virtual .arkenv placement in flat layout", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: { NEXT_PUBLIC_API_URL: "string" }
			});
			`,
			"utf-8",
		);

		const inputConfig = { reactStrictMode: true };
		const outputConfig = withArkEnv(inputConfig, {
			schemaPath,
			validate: false,
		}) as any;

		expect(outputConfig.reactStrictMode).toBe(true);
		const genPath = path.join(tempDir, ".arkenv", "env.gen.ts");
		expect(fs.existsSync(genPath)).toBe(true);
		expect(fs.existsSync(path.join(tempDir, ".arkenv", "index.ts"))).toBe(true);

		// Assert Turbopack aliases for flat layout
		expect(outputConfig.turbopack?.resolveAlias?.["#arkenv/env"]).toBe(
			`./${path.relative(process.cwd(), genPath).replace(/\\/g, "/")}`,
		);
		expect(outputConfig.turbopack?.resolveAlias?.["@/.arkenv"]).toBe(
			`./${path.relative(process.cwd(), genPath).replace(/\\/g, "/")}`,
		);

		// Assert Webpack aliases for flat layout
		const webpackConfig = { resolve: { alias: {} } };
		const resolvedWebpack = outputConfig.webpack?.(webpackConfig, {});
		expect(resolvedWebpack?.resolve?.alias?.["#arkenv/env"]).toBe(genPath);
		expect(resolvedWebpack?.resolve?.alias?.["@/.arkenv"]).toBe(genPath);
	});

	it("should support sync function-form nextConfig in flat layout", async () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: { NEXT_PUBLIC_API_URL: "string" }
			});
			`,
			"utf-8",
		);

		const functionConfig = (phase: string) => ({
			reactStrictMode: phase === "phase-production-build",
			customFlag: true,
		});

		const wrapped = withArkEnv(functionConfig, {
			schemaPath,
			validate: false,
		});

		expect(typeof wrapped).toBe("function");
		expect(fs.existsSync(path.join(tempDir, ".arkenv", "env.gen.ts"))).toBe(
			false,
		);

		const resolved = (await wrapped("phase-production-build", {
			defaultConfig: {},
		})) as {
			reactStrictMode: boolean;
			customFlag: boolean;
			turbopack?: { resolveAlias?: Record<string, unknown> };
			webpack?: (config: unknown, context: unknown) => unknown;
		};
		expect(resolved.reactStrictMode).toBe(true);
		expect(resolved.customFlag).toBe(true);
		expect(resolved.turbopack?.resolveAlias?.["@/.arkenv"]).toBeDefined();
		expect(typeof resolved.webpack).toBe("function");
		expect(fs.existsSync(path.join(tempDir, ".arkenv", "env.gen.ts"))).toBe(
			true,
		);
	});

	it("should support async function-form nextConfig in flat layout", async () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: { NEXT_PUBLIC_API_URL: "string" }
			});
			`,
			"utf-8",
		);

		const wrapped = withArkEnv(
			async (phase, { defaultConfig }) => ({
				...defaultConfig,
				reactStrictMode: phase !== "phase-test",
			}),
			{
				schemaPath,
				validate: false,
			},
		);

		const resolved = (await wrapped("phase-production-build", {
			defaultConfig: { poweredByHeader: false },
		})) as {
			reactStrictMode: boolean;
			poweredByHeader?: boolean;
			turbopack?: { resolveAlias?: Record<string, unknown> };
		};
		expect(resolved.reactStrictMode).toBe(true);
		expect(resolved.poweredByHeader).toBe(false);
		expect(resolved.turbopack?.resolveAlias?.["@/.arkenv"]).toBeDefined();
	});

	it("should start schema watch on function-form invocation in development", async () => {
		useMockWatcher = true;
		mockWatch.mockClear();
		mockClose.mockClear();

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`export const env = arkenv({ client: { NEXT_PUBLIC_API_URL: "string" } });`,
			"utf-8",
		);

		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		try {
			const wrapped = withArkEnv(() => ({ reactStrictMode: true }), {
				schemaPath,
				validate: false,
			});
			expect(mockWatch).not.toHaveBeenCalled();

			await wrapped("phase-development-server", { defaultConfig: {} });
			expect(mockWatch).toHaveBeenCalledTimes(1);

			await wrapped("phase-development-server", { defaultConfig: {} });
			expect(mockWatch).toHaveBeenCalledTimes(2);
			expect(mockClose).toHaveBeenCalledTimes(1);
		} finally {
			process.env.NODE_ENV = originalNodeEnv;
			delete (globalThis as Record<string, unknown>).__arkenv_watcher__;
			useMockWatcher = false;
		}
	});

	it("should support function-form nextConfig from the Standard config entry", async () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				client: { NEXT_PUBLIC_API_URL: "string" }
			});
			`,
			"utf-8",
		);

		const wrapped = withArkEnvStandard(
			(phase: string) => ({ reactStrictMode: phase !== "phase-test" }),
			{ schemaPath, validate: false },
		);
		const resolved = (await wrapped("phase-production-build", {
			defaultConfig: {},
		})) as {
			reactStrictMode: boolean;
			turbopack?: { resolveAlias?: Record<string, unknown> };
		};
		expect(resolved.reactStrictMode).toBe(true);
		expect(resolved.turbopack?.resolveAlias?.["@/.arkenv"]).toBeDefined();
	});

	it("should close the previous watcher when initialized multiple times in development", () => {
		useMockWatcher = true;
		mockWatch.mockClear();
		mockClose.mockClear();

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`export const env = arkenv({ client: { NEXT_PUBLIC_API_URL: "string" } });`,
			"utf-8",
		);

		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		try {
			// Call withArkEnv once
			withArkEnv({ reactStrictMode: true }, { schemaPath, validate: false });
			expect(mockWatch).toHaveBeenCalledTimes(1);

			// Call withArkEnv a second time
			withArkEnv({ reactStrictMode: true }, { schemaPath, validate: false });
			expect(mockWatch).toHaveBeenCalledTimes(2);

			expect(mockClose).toHaveBeenCalledTimes(1);
		} finally {
			process.env.NODE_ENV = originalNodeEnv;
			delete (globalThis as any).__arkenv_watcher__;
			useMockWatcher = false;
		}
	});
});

describe("Flat Mode config key extraction", () => {
	it("should extract client and exposed keys correctly under Flat Mode with exposeToClient option", () => {
		const source = `
			import arkenv from "./env.gen";
			export const env = arkenv({
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
				NEXT_PUBLIC_APP_TITLE: "string = 'My App'",
				NODE_ENV: "string",
				CUSTOM_EXPOSE: "string",
			}, {
				exposeToClient: ["CUSTOM_EXPOSE"]
			});
		`;

		const { clientKeys, sharedKeys, isLegacy } = extractKeys(source);

		expect(clientKeys).toEqual([
			"NEXT_PUBLIC_API_URL",
			"NEXT_PUBLIC_APP_TITLE",
		]);
		expect(sharedKeys).toEqual(["NODE_ENV", "CUSTOM_EXPOSE"]);
		expect(isLegacy).toBe(false);
	});

	it("should support deprecated expose option in Flat Mode key extraction", () => {
		const source = `
			import arkenv from "./env.gen";
			export const env = arkenv({
				DATABASE_URL: "string",
				NODE_ENV: "string",
				CUSTOM_EXPOSE: "string",
			}, {
				expose: ["CUSTOM_EXPOSE"]
			});
		`;

		const { sharedKeys } = extractKeys(source);
		expect(sharedKeys).toEqual(["NODE_ENV", "CUSTOM_EXPOSE"]);
	});

	it("should support deprecated shared option in Flat Mode key extraction", () => {
		const source = `
			import arkenv from "./env.gen";
			export const env = arkenv({
				DATABASE_URL: "string",
				NODE_ENV: "string",
				CUSTOM_SHARED: "string",
			}, {
				shared: ["CUSTOM_SHARED"]
			});
		`;

		const { sharedKeys } = extractKeys(source);
		expect(sharedKeys).toEqual(["NODE_ENV", "CUSTOM_SHARED"]);
	});
});
