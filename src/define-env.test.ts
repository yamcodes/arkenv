import { describe, expect, it } from "bun:test";
import { red } from "picocolors";
import { defineEnv } from "./define-env";
import { indent } from "./utils";

const expectedError = (errors: string[]) =>
	`${red("Errors found while validating environment variables:")}\n${indent(
		errors.join("\n"),
	)}\n`;

describe("defineEnv", () => {
	it("should validate string env variables", () => {
		process.env.TEST_STRING = "hello";

		const env = defineEnv({
			TEST_STRING: "string",
		});

		expect(env.TEST_STRING).toBe("hello");
	});

	it("should throw when required env variable is missing", () => {
		expect(() =>
			defineEnv({
				MISSING_VAR: "string",
			}),
		).toThrow(expectedError(["MISSING_VAR must be a string (was missing)"]));
	});

	it("should throw when env variable has wrong type", () => {
		process.env.WRONG_TYPE = "not a number";

		expect(() =>
			defineEnv({
				WRONG_TYPE: "number",
			}),
		).toThrow(expectedError(["WRONG_TYPE must be a number (was a string)"]));
	});

	it("should validate against a custom environment", () => {
		const env = {
			TEST_STRING: "hello",
		};

		const { TEST_STRING } = defineEnv(
			{
				TEST_STRING: "string",
			},
			env,
		);

		expect(TEST_STRING).toBe("hello");
	});
});
