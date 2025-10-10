import { describe, expect, it } from "vitest";
import arkenv, { type } from "./index";

describe("arkenv array defaults", () => {
	it("should work with the exact syntax from the GitHub issue", () => {
		// This is the exact code from the GitHub issue that should now work
		const Thing = arkenv({
			array: type("number.integer[]").default(() => []),
		});

		expect(Thing.array).toEqual([]);
	});

	it("should work with complex array defaults", () => {
		const env = arkenv(
			{
				ALLOWED_HOSTS: type("string[]").default(() => [
					"localhost",
					"127.0.0.1",
				]),
				FEATURE_FLAGS: type("string[]").default(() => []),
				PORTS: type("number[]").default(() => [3000, 8080]),
			},
			{},
		);

		expect(env.ALLOWED_HOSTS).toEqual(["localhost", "127.0.0.1"]);
		expect(env.FEATURE_FLAGS).toEqual([]);
		expect(env.PORTS).toEqual([3000, 8080]);
	});

	it("should support arrays with defaults and environment overrides", () => {
		const env = arkenv(
			{
				NUMBERS: type("number[]").default(() => [1, 2, 3]),
			},
			{
				NUMBERS: [4, 5, 6], // Non-string environment for testing
			},
		);

		expect(env.NUMBERS).toEqual([4, 5, 6]);
	});
});
