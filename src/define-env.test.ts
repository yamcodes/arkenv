import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { defineEnv } from "./define-env";

describe("defineEnv", () => {
	const originalEnv = { ...process.env };
	const originalExit = process.exit;
	let exitCode: number | undefined;

	beforeEach(() => {
		// Mock process.exit
		process.exit = ((code?: number) => {
			exitCode = code;
			throw new Error("process.exit");
		}) as (code?: number) => never;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		process.exit = originalExit;
		exitCode = undefined;
	});

	it("should validate string env variables", () => {
		process.env.TEST_STRING = "hello";

		const env = defineEnv({
			TEST_STRING: "string",
		});

		expect(env.TEST_STRING).toBe("hello");
	});

	it("should throw when required env variable is missing", () => {
		try {
			defineEnv({
				MISSING_VAR: "string",
			});
			expect(exitCode).toBe(1);
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should throw when env variable has wrong type", () => {
		process.env.WRONG_TYPE = "not a number";

		try {
			defineEnv({
				WRONG_TYPE: "number",
			});
			expect(true).toBe(false);
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});
});
