import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let defaultArkenv: any;
let namedArkenv: any;
let defaultStandardArkenv: any;
let namedStandardArkenv: any;
let ArkEnvError: any;

beforeAll(async () => {
	const distDir = join(__dirname, "../dist");
	if (!existsSync(distDir) || !existsSync(join(distDir, "index.mjs"))) {
		// Automatically compile the package if dist is missing
		execSync("pnpm run build", {
			cwd: join(__dirname, ".."),
			stdio: "inherit",
		});
	}

	// Dynamically load to prevent compile-time module resolution errors if dist/ is missing initially
	const index = await import("../dist/index.mjs");
	defaultArkenv = index.default;
	namedArkenv = index.arkenv;

	const standard = await import("../dist/standard.mjs");
	defaultStandardArkenv = standard.default;
	namedStandardArkenv = standard.arkenv;

	const core = await import("../dist/core.mjs");
	ArkEnvError = core.ArkEnvError;
});

describe("Distribution Built Outputs", () => {
	describe("Core Tier (arkenv/core)", () => {
		it("should export ArkEnvError and format validation issues correctly", () => {
			const error = new ArkEnvError([
				{ path: "PORT", message: "must be a valid port number" },
			]);
			expect(error.name).toBe("ArkEnvError");
			expect(error.message).toContain("PORT");
			expect(error.message).toContain("must be a valid port number");
		});
	});

	describe("Standard Tier (arkenv/standard)", () => {
		it("should export arkenv as default and named export and they should be identical", () => {
			expect(defaultStandardArkenv).toBe(namedStandardArkenv);
			expect(typeof defaultStandardArkenv).toBe("function");
		});

		it("should validate using Standard Schema validators (e.g. Zod-like)", () => {
			vi.stubEnv("PORT", "3000");
			vi.stubEnv("HOST", "localhost");

			// Mock a minimal Standard Schema 1.0 validator
			const portValidator = {
				"~standard": {
					version: 1,
					validate: (value: unknown) => {
						const num = Number(value);
						if (Number.isNaN(num)) {
							return { issues: [{ message: "must be a number" }] };
						}
						return { value: num };
					},
				},
			};

			const hostValidator = {
				"~standard": {
					version: 1,
					validate: (value: unknown) => {
						if (value !== "localhost") {
							return { issues: [{ message: "must be localhost" }] };
						}
						return { value };
					},
				},
			};

			const env = namedStandardArkenv({
				PORT: portValidator as any,
				HOST: hostValidator as any,
			});

			expect(env.PORT).toBe(3000);
			expect(env.HOST).toBe("localhost");
		});

		it("should throw ArkEnvError when validation fails", () => {
			vi.stubEnv("PORT", "invalid-port");

			const portValidator = {
				"~standard": {
					version: 1,
					validate: (value: unknown) => {
						const num = Number(value);
						if (Number.isNaN(num)) {
							return { issues: [{ path: [], message: "must be a number" }] };
						}
						return { value: num };
					},
				},
			};

			expect(() => {
				namedStandardArkenv({
					PORT: portValidator as any,
				});
			}).toThrow(ArkEnvError);
		});
	});

	describe("Main Tier (arkenv)", () => {
		it("should export arkenv as default and named export and they should be identical", () => {
			expect(defaultArkenv).toBe(namedArkenv);
			expect(typeof defaultArkenv).toBe("function");
		});

		it("should validate using ArkType schemas", () => {
			vi.stubEnv("PORT", "8080");
			vi.stubEnv("HOST", "127.0.0.1");

			// The default entrypoint supports ArkType DSL schemas
			const env = defaultArkenv({
				PORT: "number.port",
				HOST: "string.host",
			});

			expect(env.PORT).toBe(8080);
			expect(env.HOST).toBe("127.0.0.1");
		});

		it("should throw ArkEnvError for invalid environment inputs", () => {
			vi.stubEnv("PORT", "99999"); // Out of range for a port

			expect(() => {
				defaultArkenv({
					PORT: "number.port",
				});
			}).toThrow(ArkEnvError);
		});
	});
});
