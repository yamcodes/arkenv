import {
	beginSchemaCapture,
	endSchemaCapture,
	isCapturingSchema,
} from "@repo/utils";
import { afterEach, describe, expect, it } from "vitest";
import { arkenv } from "./index";

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

describe("schema capture", () => {
	afterEach(() => {
		endSchemaCapture();
	});

	it("records schema keys without validating process.env", () => {
		beginSchemaCapture();
		const env = arkenv({ DATABASE_URL: mockString });
		expect(env).toEqual({});
		expect(env.DATABASE_URL).toBeUndefined();
		expect(isCapturingSchema()).toBe(true);
		expect(endSchemaCapture()).toEqual([{ DATABASE_URL: mockString }]);
	});

	it("leaves normal validation unchanged after capture ends", () => {
		beginSchemaCapture();
		arkenv({ MISSING: mockString });
		endSchemaCapture();

		expect(() => arkenv({ MISSING: mockString }, { env: {} })).toThrow();
		expect(
			arkenv({ PRESENT: mockString }, { env: { PRESENT: "ok" } }).PRESENT,
		).toBe("ok");
	});
});
