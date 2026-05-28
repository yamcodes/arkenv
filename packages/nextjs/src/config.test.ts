import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractKeysFromObjectString,
	extractSectionContent,
	withArkEnv,
} from "./config";

describe("withArkEnv config generator", () => {
	const tempDir = path.join(__dirname, "../tmp-test-config");

	beforeEach(() => {
		fs.mkdirSync(tempDir, { recursive: true });
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	describe("extractSectionContent", () => {
		it("should extract simple section content", () => {
			const content = `
        export const client = {
          NEXT_PUBLIC_API_URL: "string",
          NEXT_PUBLIC_ANOTHER: "string",
        };
      `;
			const extracted = extractSectionContent(content, "client");
			expect(extracted).not.toBeNull();
			expect(extracted).toContain('NEXT_PUBLIC_API_URL: "string"');
			expect(extracted).toContain('NEXT_PUBLIC_ANOTHER: "string"');
		});

		it("should handle nested braces correctly", () => {
			const content = `
        export const shared = {
          NODE_ENV: type("'development' | 'production' | 'test'"),
          NESTED: {
            foo: "bar"
          }
        };
      `;
			const extracted = extractSectionContent(content, "shared");
			expect(extracted).not.toBeNull();
			expect(extracted).toContain("NODE_ENV: type");
			expect(extracted).toContain('foo: "bar"');
		});

		it("should ignore braces inside single/double quotes, template literals, and comments", () => {
			const content = `
        export const client = {
          KEY_ONE: "string { nested }",
          KEY_TWO: 'string }',
          KEY_THREE: \`template \${"string"}\`,
          // Comment with { brace }
          /* Block comment { brace } */
        };
      `;
			const extracted = extractSectionContent(content, "client");
			expect(extracted).not.toBeNull();
			expect(extracted).toContain('KEY_ONE: "string { nested }"');
			expect(extracted).toContain("KEY_TWO: 'string }'");
		});
	});

	describe("extractKeysFromObjectString", () => {
		it("should extract keys from unquoted and quoted declarations", () => {
			const content = `
        NEXT_PUBLIC_API_URL: "string",
        'NEXT_PUBLIC_API_KEY': "string",
        "NEXT_PUBLIC_ANOTHER": "string",
      `;
			const keys = extractKeysFromObjectString(content);
			expect(keys).toEqual([
				"NEXT_PUBLIC_API_URL",
				"NEXT_PUBLIC_API_KEY",
				"NEXT_PUBLIC_ANOTHER",
			]);
		});

		it("should ignore URLs inside string literals and ignore colons in ternary operators", () => {
			const content = `
        NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
        NODE_ENV: isDev ? "development" : "production",
      `;
			const keys = extractKeysFromObjectString(content);
			expect(keys).toEqual(["NEXT_PUBLIC_API_URL", "NODE_ENV"]);
		});

		it("should ignore keys defined inside nested object literals", () => {
			const content = `
        SHARED_VAR: "string",
        NESTED: {
          INNER_KEY: "string"
        },
        ANOTHER_VAR: "string",
      `;
			const keys = extractKeysFromObjectString(content);
			expect(keys).toEqual(["SHARED_VAR", "NESTED", "ANOTHER_VAR"]);
		});
	});

	describe("withArkEnv execution", () => {
		it("should throw error if schema config file cannot be found", () => {
			expect(() => {
				withArkEnv({}, { schemaPath: "nonexistent.ts" });
			}).toThrow("[arkenv] Could not locate environment schema config file");
		});

		it("should throw error if no valid schema sections are found", () => {
			const schemaFile = path.join(tempDir, "env.config.ts");
			fs.writeFileSync(schemaFile, "export const foo = { };", "utf8");

			expect(() => {
				withArkEnv({}, { schemaPath: schemaFile });
			}).toThrow(
				"No environment variable schemas (client, server, shared) found",
			);
		});

		it("should pass nextConfig through unchanged", () => {
			const schemaFile = path.join(tempDir, "env.config.ts");
			fs.writeFileSync(
				schemaFile,
				`
        export const client = {
          NEXT_PUBLIC_API_URL: "string",
        };
      `,
				"utf8",
			);

			const config = { reactStrictMode: true };
			const result = withArkEnv(config, { schemaPath: schemaFile });
			expect(result).toBe(config);
		});

		it("should write generated env.ts with correct imports and runtimeEnv destructuring", () => {
			const schemaFile = path.join(tempDir, "src/env.config.ts");
			fs.mkdirSync(path.dirname(schemaFile), { recursive: true });
			fs.writeFileSync(
				schemaFile,
				`
        export const server = {
          DATABASE_URL: "string",
        };
        export const client = {
          NEXT_PUBLIC_API_URL: "string",
          "NEXT_PUBLIC_ANOTHER": "string",
        };
        export const shared = {
          NODE_ENV: "string",
        };
      `,
				"utf8",
			);

			const outputFile = path.join(tempDir, "src/env.ts");
			withArkEnv({}, { schemaPath: schemaFile, outputPath: outputFile });

			expect(fs.existsSync(outputFile)).toBe(true);
			const generated = fs.readFileSync(outputFile, "utf8");

			// Check structure
			expect(generated).toContain('import arkenv from "@arkenv/nextjs";');
			expect(generated).toContain(
				'import { server, client, shared } from "./env.config";',
			);
			expect(generated).toContain("export const env = arkenv({");
			expect(generated).toContain("server,");
			expect(generated).toContain("client,");
			expect(generated).toContain("shared,");
			expect(generated).toContain("runtimeEnv: {");
			expect(generated).toContain(
				"NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
			);
			expect(generated).toContain(
				"NEXT_PUBLIC_ANOTHER: process.env.NEXT_PUBLIC_ANOTHER,",
			);
			expect(generated).toContain("NODE_ENV: process.env.NODE_ENV,");
		});

		it("should not re-write file if contents have not changed", () => {
			const schemaFile = path.join(tempDir, "env.config.ts");
			fs.writeFileSync(
				schemaFile,
				`
        export const client = {
          NEXT_PUBLIC_API_URL: "string",
        };
      `,
				"utf8",
			);

			const outputFile = path.join(tempDir, "env.ts");
			withArkEnv({}, { schemaPath: schemaFile, outputPath: outputFile });

			const statBefore = fs.statSync(outputFile);

			// Run again
			withArkEnv({}, { schemaPath: schemaFile, outputPath: outputFile });
			const statAfter = fs.statSync(outputFile);

			expect(statBefore.mtimeMs).toBe(statAfter.mtimeMs);
		});
	});
});
