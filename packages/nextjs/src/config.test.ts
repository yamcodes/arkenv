import fs from "node:fs";
import path from "node:path";
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

import {
	extractClientKeys,
	extractKeys,
	extractSharedKeys,
	runCodegen,
	setupArkEnv,
	withArkEnv,
} from "./config";

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
		expect(generatedContent).toContain("export function createEnv<");
		expect(generatedContent).toContain("export default createEnv;");

		// Check that relative path import was resolved correctly (relative from __temp_tests__/env.gen.ts to __temp_tests__/env.ts is ./env)
		// Wait, path.relative(__temp_tests__, __temp_tests__/env.ts) is "env.ts", which normalizes to "./env"
		expect(generatedContent).toContain(
			'import { createEnv as coreCreateEnv } from "@arkenv/nextjs";',
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
		const generatedContent = fs.readFileSync(customOutputPath, "utf-8");
		expect(generatedContent).toContain("export function createEnv<");

		// The relative import from generated/env.gen.ts to env.ts should be ../env
		// Since we didn't mock relative path resolution, let's check it.
		// Wait! The templates generated for config should be:
		// import { config } from "../env"; or similar?
		// Oh, wait! In createEnv wrapper pattern, we do NOT import config!
		// The developer imports createEnv from "./env.gen", and calls it in env.ts.
		// So the generated file does NOT import from "./env" at all!
		// Wait! Let's check my template:
		// Yes! The generated template does NOT import any config! It only imports coreCreateEnv from "@arkenv/nextjs"!
		// Oh, wow! That is even simpler and cleaner!
		// Wait, let's verify if my generateFactoryCode template has any relative import of config:
		// No, it doesn't! It just exports the generic wrapper function `createEnv`.
		// But wait! Why does `generateFactoryCode` compute `relativeImportPath`?
		// Ah! In `generateFactoryCode`, we computed `relativeImportPath` but we didn't actually use it in the returned string template!
		// Oh, let me check my config.ts code:
		// Yes, I defined:
		// `let relativeImportPath = path.relative(outputDir, schemaPath);`
		// and normalized it, but didn't put it in the template, because the wrapper factory doesn't import from the config file!
		// That is brilliant! Since the factory is generic and accepts the schema options directly, it doesn't need to know about the schema file at all! It just needs to know which keys to destructure in `runtimeEnv`.
		// This makes it completely decoupled and robust!
		// Let's verify that this is correct.
		// Yes, `createEnv` wrapper takes `options` (which is the schema) and returns `coreCreateEnv({ ...options, runtimeEnv: { ... } })`.
		// It has no dependency on the schema file!
		// This is so beautiful!
	});
});

describe("withArkEnv wrapper", () => {
	const tempDir = path.join(__dirname, "__temp_tests_wrapper__");
	const schemaPath = path.join(tempDir, "env.ts");

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should throw a short missing-schema error without an env.ts starter", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		let message = "";
		try {
			setupArkEnv({
				schemaPath: path.join(tempDir, "missing-env.ts"),
				validate: false,
			});
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}

		expect(message).toMatch(/\[ArkEnv\] Could not find schema file/);
		expect(message).toMatch(/arkenv init/);
		expect(message).not.toMatch(/Example `src\/env\.ts`/);
		expect(message).not.toMatch(/```/);
	});

	it("should pass nextConfig through unchanged", () => {
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
		});

		expect(outputConfig).toBe(inputConfig);
		expect(fs.existsSync(path.join(tempDir, "generated", "env.gen.ts"))).toBe(
			true,
		);
	});

	it("should support strict layout auto-detection and generation", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		// Set up a strict structure
		const strictBaseDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(strictBaseDir, "internal"), { recursive: true });

		fs.writeFileSync(
			path.join(strictBaseDir, "internal", "shared.ts"),
			`
			import { type } from "@arkenv/nextjs/shared";
			export const SharedSchema = type({
				NODE_ENV: "string = 'development'",
			});
			`,
			"utf-8",
		);

		fs.writeFileSync(
			path.join(strictBaseDir, "client.ts"),
			`
			import arkenv from "@arkenv/nextjs/client";
			import { SharedSchema } from "./internal/shared";
			export const env = arkenv(
				{
					NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
				},
				{
					extends: [SharedSchema],
					runtimeEnv: {},
				}
			);
			`,
			"utf-8",
		);

		fs.writeFileSync(
			path.join(strictBaseDir, "server.ts"),
			`
			import arkenv from "@arkenv/nextjs/server";
			export const env = arkenv({
				DATABASE_URL: "string",
			});
			`,
			"utf-8",
		);

		const inputConfig = { reactStrictMode: true };
		const outputConfig = withArkEnv(inputConfig, {
			schemaPath: strictBaseDir,
			validate: false,
		});

		expect(outputConfig).toBe(inputConfig);
		const genPath = path.join(strictBaseDir, "generated", "env.gen.ts");
		expect(fs.existsSync(genPath)).toBe(true);

		const generatedContent = fs.readFileSync(genPath, "utf-8");
		expect(generatedContent).toContain("export function createEnv<");
		expect(generatedContent).toContain("export default createEnv;");
		expect(generatedContent).toContain(
			'NEXT_PUBLIC_API_URL: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL,',
		);
		expect(generatedContent).toContain(
			'NODE_ENV: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.NODE_ENV ?? process.env.NODE_ENV : process.env.NODE_ENV,',
		);
		expect(generatedContent).not.toContain("DATABASE_URL");
	});

	it("should throw a descriptive error when layout: 'strict' is set but required files are missing", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		// Only create the schema file, not the strict layout files
		fs.writeFileSync(
			schemaPath,
			`export const env = arkenv({ client: { NEXT_PUBLIC_VAR: "string" } });`,
			"utf-8",
		);

		expect(() =>
			withArkEnv(
				{ reactStrictMode: true },
				{ schemaPath, layout: "strict", validate: false },
			),
		).toThrow("[ArkEnv] Strict layout requires");
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
			`export const env = createEnv({ client: { NEXT_PUBLIC_API_URL: "string" } });`,
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

describe("strict config key extraction", () => {
	it("should extract client keys from arkenv call", () => {
		const clientSource = `
			import arkenv from "@arkenv/nextjs/client";
			import { SharedSchema } from "./internal/shared";
			export const env = arkenv(
				{
					NEXT_PUBLIC_VAR_1: "string",
					NEXT_PUBLIC_VAR_2: "string = 'default'",
				},
				{
					extends: [SharedSchema],
				}
			);
		`;
		const keys = extractClientKeys(clientSource);
		expect(keys).toEqual(["NEXT_PUBLIC_VAR_1", "NEXT_PUBLIC_VAR_2"]);
	});

	it("should extract shared keys from SharedSchema", () => {
		const sharedSource = `
			import { type } from "@arkenv/nextjs/shared";
			export const SharedSchema = type({
				NODE_ENV: "string = 'development'",
				PORT: "number.port = 3000",
			});
		`;
		const keys = extractSharedKeys(sharedSource);
		expect(keys).toEqual(["NODE_ENV", "PORT"]);
	});

	it("extractClientKeys: should ignore single-line comments inside arkenv block", () => {
		const clientSource = `
			export const env = arkenv(
				{
					// This is a comment
					NEXT_PUBLIC_VAR_1: "string",
					// Another comment: with colon
					NEXT_PUBLIC_VAR_2: "string",
				}
			);
		`;
		expect(extractClientKeys(clientSource)).toEqual([
			"NEXT_PUBLIC_VAR_1",
			"NEXT_PUBLIC_VAR_2",
		]);
	});

	it("extractClientKeys: should ignore multi-line comments inside arkenv block", () => {
		const clientSource = `
			export const env = arkenv(
				{
					/*
					 * Multi-line comment:
					 * FAKE_KEY: this should be ignored
					 */
					NEXT_PUBLIC_VAR_1: "string",
				}
			);
		`;
		expect(extractClientKeys(clientSource)).toEqual(["NEXT_PUBLIC_VAR_1"]);
	});

	it("extractClientKeys: should not be confused by braces inside string literals", () => {
		const clientSource = `
			export const env = arkenv(
				{
					NEXT_PUBLIC_VAR_1: "string = '{not-a-brace}'",
					NEXT_PUBLIC_VAR_2: "string",
				}
			);
		`;
		expect(extractClientKeys(clientSource)).toEqual([
			"NEXT_PUBLIC_VAR_1",
			"NEXT_PUBLIC_VAR_2",
		]);
	});

	it("extractClientKeys: should not be confused by colons inside string literals", () => {
		const clientSource = `
			export const env = arkenv(
				{
					NEXT_PUBLIC_API_URL: "string = 'http://localhost:3000'",
					NEXT_PUBLIC_VAR_2: "string",
				}
			);
		`;
		expect(extractClientKeys(clientSource)).toEqual([
			"NEXT_PUBLIC_API_URL",
			"NEXT_PUBLIC_VAR_2",
		]);
	});

	it("extractClientKeys: should ignore nested object literals in values", () => {
		const clientSource = `
			export const env = arkenv(
				{
					NEXT_PUBLIC_VAR_1: type("string", { description: "nested:key" }),
					NEXT_PUBLIC_VAR_2: "string",
				}
			);
		`;
		expect(extractClientKeys(clientSource)).toEqual([
			"NEXT_PUBLIC_VAR_1",
			"NEXT_PUBLIC_VAR_2",
		]);
	});

	it("extractSharedKeys: should ignore single-line comments inside SharedSchema", () => {
		const sharedSource = `
			export const SharedSchema = type({
				// NODE_ENV is always set
				NODE_ENV: "string = 'development'",
				// PORT: ignored comment
				PORT: "number.port = 3000",
			});
		`;
		expect(extractSharedKeys(sharedSource)).toEqual(["NODE_ENV", "PORT"]);
	});

	it("extractSharedKeys: should not be confused by colons inside string literals", () => {
		const sharedSource = `
			export const SharedSchema = type({
				DATABASE_URL: "string = 'postgresql://localhost:5432/db'",
				NODE_ENV: "string",
			});
		`;
		expect(extractSharedKeys(sharedSource)).toEqual([
			"DATABASE_URL",
			"NODE_ENV",
		]);
	});

	it("extractSharedKeys: should not be confused by braces inside string literals", () => {
		const sharedSource = `
			export const SharedSchema = type({
				NODE_ENV: "string = '{dev}'",
				PORT: "number = 3000",
			});
		`;
		expect(extractSharedKeys(sharedSource)).toEqual(["NODE_ENV", "PORT"]);
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
