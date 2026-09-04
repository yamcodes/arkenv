import {
	beginSchemaCapture,
	endSchemaCapture,
	isCapturingSchema,
} from "@repo/utils";
import { afterEach, describe, expect, it } from "vitest";
import arkenv, { arkenv as namedArkenv } from "./safe";

const mockString = {
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		validate: (value: unknown) =>
			typeof value === "string"
				? { value }
				: { issues: [{ message: "Expected string" }] },
	},
};

describe("arkenv from @arkenv/standard/safe", () => {
	afterEach(() => {
		endSchemaCapture();
	});

	it("exports the same function as default and named", () => {
		expect(arkenv).toBe(namedArkenv);
	});

	it("should run arkenv safely", () => {
		const result = arkenv({ PORT: mockString }, { env: { PORT: "3000" } });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ PORT: "3000" });
		}
	});

	it("should return failure with invalid input", () => {
		const result = arkenv({ PORT: mockString }, { env: {} });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues).toBeDefined();
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	it("records the schema during CLI capture without validating env", () => {
		beginSchemaCapture();
		const result = arkenv({ DATABASE_URL: mockString }, { env: {} });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({});
		}
		expect(isCapturingSchema()).toBe(true);
		expect(endSchemaCapture()).toEqual([{ DATABASE_URL: mockString }]);
	});
});
