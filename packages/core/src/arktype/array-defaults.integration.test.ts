import { describe, expect, it } from "vitest";
import arkenv, { type } from "@";

describe("arkenv array defaults", () => {
	it("should work with arrow function array defaults", () => {
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

	it("accepts empty array and object defaults in string syntax", () => {
		const env = arkenv({
			FEATURE_FLAGS: "string[] = []",
			METADATA: "object = {}",
		});

		expect(env.FEATURE_FLAGS).toEqual([]);
		expect(env.METADATA).toEqual({});

		const Flags = type({
			FEATURE_FLAGS: "string[] = []",
			METADATA: "object = {}",
		});
		const first = Flags.assert({});
		first.FEATURE_FLAGS.push("beta");
		expect(Flags.assert({})).toEqual({
			FEATURE_FLAGS: [],
			METADATA: {},
		});
	});

	it("should support arrays with defaults and environment overrides", () => {
		const env = arkenv(
			{
				NUMBERS: type("number[]").default(() => [1, 2, 3]),
			},
			{
				env: {
					NUMBERS: "4,5,6",
				},
			},
		);

		expect(env.NUMBERS).toEqual([4, 5, 6]);
	});
});
