import {
	ArkEnvError,
	type EnvIssue,
	formatIssues,
	safeStringify,
	shouldRedact,
} from "@repo/utils";
import { describe, expect, it } from "vitest";
import { arkenv } from "./arkenv";

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

describe("formatIssues", () => {
	it("should format issues correctly", () => {
		const issues: EnvIssue[] = [
			{
				path: "PORT",
				message: "must be a number",
				code: "INVALID_TYPE",
			},
			{
				path: "API_KEY",
				message: "is required",
				code: "MISSING_VARIABLE",
			},
		];

		const result = formatIssues(issues);
		expect(result).toContain("PORT");
		expect(result).toContain("must be a number");
		expect(result).toContain("API_KEY");
		expect(result).toContain("is required");
	});
});

describe("ArkEnvError & arkenv safe mode", () => {
	it("should create error and store issues", () => {
		const issues: EnvIssue[] = [
			{
				path: "PORT",
				message: 'must be a number (was "abc")',
				code: "INVALID_TYPE",
			},
		];

		const error = new ArkEnvError(issues);
		expect(error.issues).toEqual(issues);
		expect(error.name).toBe("ArkEnvError");
	});

	it("should run arkenv safely", () => {
		const result = arkenv(
			{ PORT: "number" },
			{ safe: true, env: { PORT: "3000" } },
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ PORT: 3000 });
		}
	});

	it("should return failure for arkenv safe mode with invalid input", () => {
		const result = arkenv(
			{ PORT: "number" },
			{ safe: true, env: { PORT: "abc" } },
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues).toBeDefined();
			expect(result.issues.length).toBe(1);
			expect(result.issues[0].path).toBe("PORT");
		}
	});
});
