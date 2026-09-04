import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
let standardArkEnvError: any;

beforeAll(async () => {
	const distDir = join(__dirname, "../dist");
	if (!existsSync(distDir) || !existsSync(join(distDir, "index.js"))) {
		// Automatically compile the package if dist is missing
		execSync("pnpm run build", {
			cwd: join(__dirname, ".."),
			stdio: "inherit",
		});
	}

	const standardDistDir = join(__dirname, "../../standard/dist");
	if (
		!existsSync(standardDistDir) ||
		!existsSync(join(standardDistDir, "index.js"))
	) {
		// Automatically compile @arkenv/standard if dist is missing
		execSync("pnpm run build", {
			cwd: join(__dirname, "../../standard"),
			stdio: "inherit",
		});
	}

	// Dynamically load to prevent compile-time module resolution errors if dist/ is missing initially
	const index = await import("../dist/index.js");
	defaultArkenv = index.default;
	namedArkenv = index.arkenv;

	const standard = await import("../../standard/dist/index.js");
	defaultStandardArkenv = standard.default;
	namedStandardArkenv = standard.arkenv;

	ArkEnvError = index.ArkEnvError;
	standardArkEnvError = standard.ArkEnvError;
});

describe("Distribution Built Outputs", () => {
	describe("ESM-only dist", () => {
		it("ships standard .js and .d.ts files with no CJS artifacts", () => {
			const distDir = join(__dirname, "../dist");
			const files = readdirSync(distDir, { recursive: true });

			expect(files).toContain("index.js");
			expect(files).toContain("index.d.ts");

			const cjsArtifacts = files.filter(
				(file) => file.endsWith(".cjs") || file.endsWith(".d.cts"),
			);
			expect(cjsArtifacts).toEqual([]);
		});
	});

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
			}).toThrow(standardArkEnvError);
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

	describe("Subpaths", () => {
		it("exports formatIssues and getSchemaKeys from @arkenv/core/issues", async () => {
			const issues = await import("../dist/issues.js");
			expect(typeof issues.formatIssues).toBe("function");
			expect(typeof issues.getSchemaKeys).toBe("function");
		});

		it("does not re-export formatIssues or getSchemaKeys from the main barrel", async () => {
			const index = await import("../dist/index.js");
			expect("formatIssues" in index).toBe(false);
			expect("getSchemaKeys" in index).toBe(false);
		});

		it("exports arkenv from @arkenv/core/safe as default and named", async () => {
			const safe = await import("../dist/safe.js");
			expect(typeof safe.arkenv).toBe("function");
			expect(safe.default).toBe(safe.arkenv);
			const result = safe.arkenv({ PORT: "number" }, { env: { PORT: "3000" } });
			expect(result.success).toBe(true);
		});

		it("does not re-export schema-capture helpers or safeExecute from the default entry", () => {
			const source = readFileSync(join(__dirname, "../dist/index.js"), "utf8");
			expect(source).not.toContain("isCapturingSchema");
			expect(source).not.toContain("recordSchemaCapture");
			expect(source).not.toContain("beginSchemaCapture");
			expect(source).not.toContain("safeExecute");
		});

		it("exports arkenv from @arkenv/standard/safe as default and named", async () => {
			const safe = await import("../../standard/dist/safe.js");
			expect(typeof safe.arkenv).toBe("function");
			expect(safe.default).toBe(safe.arkenv);
			const mock = {
				"~standard": {
					version: 1 as const,
					validate: (value: unknown) => ({ value }),
				},
			};
			const result = safe.arkenv({ PORT: mock }, { env: { PORT: "3000" } });
			expect(result.success).toBe(true);
		});
	});
});
