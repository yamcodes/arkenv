import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupArkEnv as originalSetupArkEnv } from "./config";

const nextjsSrc = path.resolve(__dirname);

const testAliases = {
	"@arkenv/nextjs/config": path.join(nextjsSrc, "config/index.ts"),
	"@arkenv/nextjs": path.join(nextjsSrc, "index.ts"),
	"@arkenv/core": path.join(nextjsSrc, "../../core/src/index.ts"),
	"@repo/scope": path.join(nextjsSrc, "../../internal/scope/src/index.ts"),
	"@repo/types": path.join(nextjsSrc, "../../internal/types/src/index.ts"),
};

function setupArkEnv(options?: any) {
	return originalSetupArkEnv(options, {
		_jitiAliases: {
			...testAliases,
			...options?._jitiAliases,
		},
	});
}

describe("build-time environment validation", () => {
	const tempDir = path.join(__dirname, "__temp_validation_tests__");
	const schemaPath = path.join(tempDir, "env.ts");
	const outputPath = path.join(tempDir, "generated", "env.gen.ts");
	let exitSpy: any;
	let consoleErrorSpy: any;

	beforeEach(() => {
		exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((code?: string | number | null | undefined) => {
				throw new Error(`process.exit called with ${code}`);
			});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
	});

	afterEach(() => {
		if (consoleErrorSpy.mock.calls.length > 0) {
			for (const call of consoleErrorSpy.mock.calls) {
				console.info("TEST CONSOLE.ERROR:", ...call);
			}
		}

		exitSpy.mockRestore();
		consoleErrorSpy.mockRestore();

		// Clean up process.env mocks
		delete process.env.DATABASE_URL;
		delete process.env.NEXT_PUBLIC_API_URL;
		delete process.env.NODE_ENV;

		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("flat layout", () => {
		it("should pass when all required environment variables are present and valid", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "./generated/env.gen";
				export const env = arkenv({
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			process.env.DATABASE_URL = "postgres://localhost:5432/db";
			process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";

			// First run setup to generate the template file (env.gen.ts) so env.ts can import it
			setupArkEnv({
				schemaPath,
				outputPath,
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					validate: true,
				});
			}).not.toThrow();

			expect(exitSpy).not.toHaveBeenCalled();
			expect(fs.existsSync(outputPath)).toBe(true);
		});

		it("should exit build when a required environment variable is missing", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "./generated/env.gen";
				export const env = arkenv({
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
				});
				`,
				"utf-8",
			);

			process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
			// DATABASE_URL is missing

			// First run setup to generate the template file (env.gen.ts) so env.ts can import it
			setupArkEnv({
				schemaPath,
				outputPath,
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					validate: true,
				});
			}).toThrow("process.exit called with 1");

			expect(exitSpy).toHaveBeenCalledWith(1);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it("should exit build when an environment variable has an invalid type", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "./generated/env.gen";
				export const env = arkenv({
					PORT: "number",
				});
				`,
				"utf-8",
			);

			process.env.PORT = "not-a-number";

			// First run setup to generate the template file (env.gen.ts) so env.ts can import it
			setupArkEnv({
				schemaPath,
				outputPath,
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					validate: true,
				});
			}).toThrow("process.exit called with 1");

			expect(exitSpy).toHaveBeenCalledWith(1);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("codegen option", () => {
		it("should skip file generation but still validate when codegen is false", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "@arkenv/nextjs";
				export const env = arkenv({
					DATABASE_URL: "string",
				}, {
					runtimeEnv: {
						DATABASE_URL: process.env.DATABASE_URL,
					}
				});
				`,
				"utf-8",
			);

			// Missing DATABASE_URL, should exit build
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					codegen: false,
					validate: true,
				});
			}).toThrow("process.exit called with 1");

			expect(exitSpy).toHaveBeenCalledWith(1);
			expect(fs.existsSync(outputPath)).toBe(false);

			// Provide DATABASE_URL, should pass
			process.env.DATABASE_URL = "postgres://localhost/db";
			exitSpy.mockClear();

			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					codegen: false,
					validate: true,
				});
			}).not.toThrow();

			expect(exitSpy).not.toHaveBeenCalled();
			expect(fs.existsSync(outputPath)).toBe(false);
		});
	});
});
