import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupArkEnv as originalSetupArkEnv } from "./config";

const nextjsSrc = path.resolve(__dirname);
const arkenvSrc = path.resolve(nextjsSrc, "../../arkenv/src");

const testAliases = {
	"@arkenv/nextjs/shared": path.join(nextjsSrc, "shared.ts"),
	"@arkenv/nextjs/server": path.join(nextjsSrc, "server.ts"),
	"@arkenv/nextjs/client": path.join(nextjsSrc, "client.ts"),
	"@arkenv/nextjs/config": path.join(nextjsSrc, "config.ts"),
	"@arkenv/nextjs": path.join(nextjsSrc, "index.ts"),
	"arkenv/standard": path.join(arkenvSrc, "standard.ts"),
	"arkenv/core": path.join(arkenvSrc, "core.ts"),
	arkenv: path.join(arkenvSrc, "index.ts"),
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
				layout: "flat",
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					layout: "flat",
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
				layout: "flat",
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					layout: "flat",
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
				layout: "flat",
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath,
					outputPath,
					layout: "flat",
					validate: true,
				});
			}).toThrow("process.exit called with 1");

			expect(exitSpy).toHaveBeenCalledWith(1);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("strict layout", () => {
		const strictBaseDir = path.join(tempDir, "env");
		const clientPath = path.join(strictBaseDir, "client.ts");
		const serverPath = path.join(strictBaseDir, "server.ts");
		const sharedPath = path.join(strictBaseDir, "internal", "shared.ts");
		const strictOutputPath = path.join(
			strictBaseDir,
			"generated",
			"env.gen.ts",
		);

		beforeEach(() => {
			fs.mkdirSync(path.join(strictBaseDir, "internal"), { recursive: true });
		});

		it("should pass when strict layout variables are all valid", () => {
			fs.writeFileSync(
				sharedPath,
				`
				import { type } from "${path.resolve(__dirname, "./shared.ts")}";
				export const SharedSchema = type({
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				clientPath,
				`
				import arkenv from "./generated/env.gen";
				import { SharedSchema } from "./internal/shared";
				export const env = arkenv({
					NEXT_PUBLIC_API_URL: "string",
				}, {
					extends: [SharedSchema],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
						NODE_ENV: process.env.NODE_ENV,
					}
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				serverPath,
				`
				import arkenv from "${path.resolve(__dirname, "./server.ts")}";
				import { env as clientEnv } from "./client";
				export const env = arkenv({
					DATABASE_URL: "string",
				}, {
					extends: [clientEnv],
				});
				`,
				"utf-8",
			);

			process.env.DATABASE_URL = "postgres://localhost/db";
			process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";

			// First run setup to generate the template file (env.gen.ts) so clientPath can import it
			// We disable validation on first pass to let the file compile
			setupArkEnv({
				schemaPath: strictBaseDir,
				outputPath: strictOutputPath,
				layout: "strict",
				validate: false,
			});

			// Now enable validation for the second pass
			expect(() => {
				setupArkEnv({
					schemaPath: strictBaseDir,
					outputPath: strictOutputPath,
					layout: "strict",
					validate: true,
				});
			}).not.toThrow();

			expect(exitSpy).not.toHaveBeenCalled();
		});

		it("should exit build when a server variable is missing in strict layout", () => {
			fs.writeFileSync(
				sharedPath,
				`
				import { type } from "${path.resolve(__dirname, "./shared.ts")}";
				export const SharedSchema = type({
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				clientPath,
				`
				import arkenv from "./generated/env.gen";
				import { SharedSchema } from "./internal/shared";
				export const env = arkenv({
					NEXT_PUBLIC_API_URL: "string",
				}, {
					extends: [SharedSchema],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
						NODE_ENV: process.env.NODE_ENV,
					}
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				serverPath,
				`
				import arkenv from "${path.resolve(__dirname, "./server.ts")}";
				import { env as clientEnv } from "./client";
				export const env = arkenv({
					DATABASE_URL: "string",
				}, {
					extends: [clientEnv],
				});
				`,
				"utf-8",
			);

			process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";
			// DATABASE_URL is missing

			// First pass codegen
			setupArkEnv({
				schemaPath: strictBaseDir,
				outputPath: strictOutputPath,
				layout: "strict",
				validate: false,
			});

			// Second pass validation
			expect(() => {
				setupArkEnv({
					schemaPath: strictBaseDir,
					outputPath: strictOutputPath,
					layout: "strict",
					validate: true,
				});
			}).toThrow("process.exit called with 1");

			expect(exitSpy).toHaveBeenCalledWith(1);
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
					layout: "flat",
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
					layout: "flat",
					codegen: false,
					validate: true,
				});
			}).not.toThrow();

			expect(exitSpy).not.toHaveBeenCalled();
			expect(fs.existsSync(outputPath)).toBe(false);
		});
	});
});
