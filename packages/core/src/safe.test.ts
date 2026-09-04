import {
	beginSchemaCapture,
	endSchemaCapture,
	isCapturingSchema,
} from "@repo/utils";
import { afterEach, describe, expect, it } from "vitest";
import { tryArkenv } from "./safe";

describe("tryArkenv", () => {
	afterEach(() => {
		endSchemaCapture();
	});

	it("should run arkenv safely", () => {
		const result = tryArkenv({ PORT: "number" }, { env: { PORT: "3000" } });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ PORT: 3000 });
		}
	});

	it("should return failure with invalid input", () => {
		const result = tryArkenv({ PORT: "number" }, { env: { PORT: "abc" } });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues).toBeDefined();
			expect(result.issues.length).toBe(1);
			expect(result.issues[0].path).toBe("PORT");
		}
	});

	it("records the schema during CLI capture without validating env", () => {
		beginSchemaCapture();
		const result = tryArkenv(
			{ DATABASE_URL: "string", PORT: "number = 3000" },
			{ env: {} },
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({});
		}
		expect(isCapturingSchema()).toBe(true);
		expect(endSchemaCapture()).toEqual([
			{
				DATABASE_URL: "string",
				PORT: "number = 3000",
			},
		]);
	});
});
