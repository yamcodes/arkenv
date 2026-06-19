import { describe, expect, it } from "vitest";
import { safeArkEnv } from "./arkenv";
import { ArkEnvError, type EnvIssue, formatError, formatIssues } from "./core";
import { safeStringify, shouldRedact } from "@/utils/redact";

describe("shouldRedact", () => {
	it("should detect sensitive keys", () => {
		expect(shouldRedact("DATABASE_URL")).toBe(true);
		expect(shouldRedact("DB_PASSWORD")).toBe(true);
		expect(shouldRedact("SECRET_KEY")).toBe(true);
		expect(shouldRedact("API_TOKEN")).toBe(true);
		expect(shouldRedact("PORT")).toBe(false);
		expect(shouldRedact("HOST")).toBe(false);
	});

	it("should not redact keys containing 'PUBLIC'", () => {
		expect(shouldRedact("NEXT_PUBLIC_API_KEY")).toBe(false);
		expect(shouldRedact("PUBLIC_TOKEN")).toBe(false);
		expect(shouldRedact("PUBLIC_URL")).toBe(false);
	});

	it("should redact keys matching specific sensitive patterns", () => {
		expect(shouldRedact("auth")).toBe(true);
		expect(shouldRedact("password")).toBe(true);
		expect(shouldRedact("pass")).toBe(true);
		expect(shouldRedact("secret")).toBe(true);
	});
});

describe("safeStringify", () => {
	it("should format primitives", () => {
		expect(safeStringify(undefined, "PORT")).toBe("missing");
		expect(safeStringify(null, "PORT")).toBe("null");
		expect(safeStringify("abc", "PORT")).toBe('"abc"');
		expect(safeStringify(123, "PORT")).toBe("123");
		expect(safeStringify(true, "PORT")).toBe("true");
	});

	it("should redact sensitive values by default", () => {
		expect(safeStringify("super-secret", "DB_PASSWORD")).toBe("[REDACTED]");
	});

	it("should not redact sensitive values if debugSecrets is true", () => {
		expect(
			safeStringify("super-secret", "DB_PASSWORD", { debugSecrets: true }),
		).toBe('"super-secret"');
	});

	it("should format arrays with truncation", () => {
		expect(safeStringify([1, 2, 3], "PORT")).toBe("[1, 2, 3]");
		expect(safeStringify([1, 2, 3, 4, 5], "PORT")).toBe(
			"[1, 2, 3, ...(+2 more)]",
		);
	});

	it("should format objects with truncation", () => {
		expect(safeStringify({ a: 1, b: 2 }, "PORT")).toBe("{ a: 1, b: 2 }");
		expect(safeStringify({ a: 1, b: 2, c: 3, d: 4 }, "PORT")).toBe(
			"{ a: 1, b: 2, c: 3, ...(+1 more) }",
		);
	});
});

describe("formatIssues & formatError", () => {
	it("should format issues correctly", () => {
		const issues: EnvIssue[] = [
			{
				path: "PORT",
				message: "must be a number",
				code: "INVALID_TYPE",
				meta: { engine: "arktype" },
			},
			{
				path: "API_KEY",
				message: "is required",
				code: "MISSING_VARIABLE",
				meta: { engine: "arktype" },
			},
		];

		const result = formatIssues(issues);
		expect(result).toContain("PORT");
		expect(result).toContain("must be a number");
		expect(result).toContain("API_KEY");
		expect(result).toContain("is required");
	});

	it("should format errors via formatError", () => {
		const issues: EnvIssue[] = [
			{
				path: "PORT",
				message: "must be a number",
				code: "INVALID_TYPE",
				meta: { engine: "arktype" },
			},
		];
		const error = new ArkEnvError(issues);
		const result = formatError(error);
		expect(result).toContain("PORT");
		expect(result).toContain("must be a number");
	});
});

describe("ArkEnvError & safeArkEnv", () => {
	it("should create error and store issues", () => {
		const issues: EnvIssue[] = [
			{
				path: "PORT",
				message: 'must be a number (was "abc")',
				code: "INVALID_TYPE",
				meta: { engine: "arktype" },
			},
		];

		const error = new ArkEnvError(issues);
		expect(error.issues).toEqual(issues);
		expect(error.name).toBe("ArkEnvError");
	});

	it("should run safeArkEnv successfully", () => {
		const result = safeArkEnv({ PORT: "number" }, { env: { PORT: "3000" } });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ PORT: 3000 });
		}
	});

	it("should return failure for safeArkEnv with invalid input", () => {
		const result = safeArkEnv({ PORT: "number" }, { env: { PORT: "abc" } });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(ArkEnvError);
			expect(result.error.issues).toBeDefined();
			expect(result.error.issues.length).toBe(1);
			expect(result.error.issues[0].path).toBe("PORT");
		}
	});
});
