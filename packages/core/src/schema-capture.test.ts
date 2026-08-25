import { afterEach, describe, expect, it } from "vitest";
import {
	arkenv,
	beginSchemaCapture,
	endSchemaCapture,
	isCapturingSchema,
} from "@";

describe("schema capture", () => {
	afterEach(() => {
		endSchemaCapture();
	});

	it("records schema keys without validating process.env", () => {
		beginSchemaCapture();
		const env = arkenv({
			DATABASE_URL: "string",
			PORT: "number = 3000",
		});
		expect(env).toEqual({});
		expect(isCapturingSchema()).toBe(true);
		expect(endSchemaCapture()).toEqual([
			{
				DATABASE_URL: "string",
				PORT: "number = 3000",
			},
		]);
	});

	it("leaves normal validation unchanged after capture ends", () => {
		beginSchemaCapture();
		arkenv({ MISSING: "string" });
		endSchemaCapture();

		expect(() => arkenv({ MISSING: "string" })).toThrow();
		expect(
			arkenv({ PRESENT: "string" }, { env: { PRESENT: "ok" } }).PRESENT,
		).toBe("ok");
	});
});
