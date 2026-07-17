import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupArkEnv as originalSetupArkEnv } from "./config";

const nuxtSrc = path.resolve(__dirname);
const coreSrc = path.resolve(nuxtSrc, "../../core/src");

const testAliases = {
	"@arkenv/nuxt/server": path.join(nuxtSrc, "server.ts"),
	"@arkenv/nuxt/client": path.join(nuxtSrc, "client.ts"),
	"@arkenv/nuxt/config": path.join(nuxtSrc, "config.ts"),
	"@arkenv/nuxt": path.join(nuxtSrc, "index.ts"),
	"@arkenv/core": path.join(coreSrc, "index.ts"),
	"@repo/scope": path.join(nuxtSrc, "../../internal/scope/src/index.ts"),
	"@repo/types": path.join(nuxtSrc, "../../internal/types/src/index.ts"),
	"#imports": path.join(nuxtSrc, "mock-imports.ts"),
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
	let consoleErrorSpy: any;

	beforeEach(() => {
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

		consoleErrorSpy.mockRestore();

		// Clean up process.env mocks
		delete process.env.DATABASE_URL;
		delete process.env.NUXT_PUBLIC_API_URL;
		delete process.env.NODE_ENV;
		delete process.env.PORT;

		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("flat layout", () => {
		it("should pass when all required environment variables are present and valid", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "@arkenv/nuxt";
				export const env = arkenv({
					DATABASE_URL: "string",
					NUXT_PUBLIC_API_URL: "string",
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			process.env.DATABASE_URL = "postgres://localhost:5432/db";
			process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";

			expect(() => {
				setupArkEnv({
					schemaPath,
					layout: "flat",
					validate: true,
				});
			}).not.toThrow();
		});

		it("should throw error when a required environment variable is missing", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "@arkenv/nuxt";
				export const env = arkenv({
					DATABASE_URL: "string",
					NUXT_PUBLIC_API_URL: "string",
				});
				`,
				"utf-8",
			);

			process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";

			expect(() => {
				setupArkEnv({
					schemaPath,
					layout: "flat",
					validate: true,
				});
			}).toThrow(/Errors found while validating/);

			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it("should throw error when an environment variable has an invalid type", () => {
			fs.writeFileSync(
				schemaPath,
				`
				import arkenv from "@arkenv/nuxt";
				export const env = arkenv({
					PORT: "number",
				});
				`,
				"utf-8",
			);

			process.env.PORT = "not-a-number";

			expect(() => {
				setupArkEnv({
					schemaPath,
					layout: "flat",
					validate: true,
				});
			}).toThrow(/Errors found while validating/);

			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("strict layout", () => {
		const strictBaseDir = path.join(tempDir, "env");
		const clientPath = path.join(strictBaseDir, "client.ts");
		const serverPath = path.join(strictBaseDir, "server.ts");
		const sharedPath = path.join(strictBaseDir, "internal", "shared.ts");

		beforeEach(() => {
			fs.mkdirSync(path.join(strictBaseDir, "internal"), { recursive: true });
		});

		it("should pass when strict layout variables are all valid", () => {
			fs.writeFileSync(
				sharedPath,
				`
				import { type } from "@arkenv/core";
				export const SharedSchema = type({
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				clientPath,
				`
				import arkenv from "@arkenv/nuxt/client";
				import { SharedSchema } from "./internal/shared";
				export const env = arkenv({
					NUXT_PUBLIC_API_URL: "string",
				}, {
					extends: [SharedSchema]
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
			process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";

			expect(() => {
				setupArkEnv({
					schemaPath: strictBaseDir,
					layout: "strict",
					validate: true,
				});
			}).not.toThrow();
		});

		it("should throw error when a server variable is missing in strict layout", () => {
			fs.writeFileSync(
				sharedPath,
				`
				import { type } from "@arkenv/core";
				export const SharedSchema = type({
					NODE_ENV: "'development' | 'production'",
				});
				`,
				"utf-8",
			);

			fs.writeFileSync(
				clientPath,
				`
				import arkenv from "@arkenv/nuxt/client";
				import { SharedSchema } from "./internal/shared";
				export const env = arkenv({
					NUXT_PUBLIC_API_URL: "string",
				}, {
					extends: [SharedSchema]
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

			process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
			process.env.NODE_ENV = "development";
			// DATABASE_URL is missing

			expect(() => {
				setupArkEnv({
					schemaPath: strictBaseDir,
					layout: "strict",
					validate: true,
				});
			}).toThrow(/Errors found while validating/);
		});
	});
});
