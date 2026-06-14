import { describe, expect, it } from "vitest";
import { applyCoercion, stripEmptyStrings } from "./shared";

describe("stripEmptyStrings", () => {
	it("should remove keys with empty string values", () => {
		const env = { A: "", B: "value", C: "" };
		const result = stripEmptyStrings(env);
		expect(result).toEqual({ B: "value" });
	});

	it("should preserve keys with undefined values", () => {
		const env = { A: undefined, B: "value" };
		const result = stripEmptyStrings(env);
		expect(result).toEqual({ A: undefined, B: "value" });
	});

	it("should return a new object", () => {
		const env = { A: "value" };
		const result = stripEmptyStrings(env);
		expect(result).not.toBe(env);
	});
});

describe("applyCoercion - safety and non-mutation", () => {
	it("should coerce values on frozen objects without crashing", () => {
		const env = {
			DATABASE: {
				host: "localhost",
				port: "3000",
			},
			API: {
				url: "http://localhost",
				retries: "3",
			},
		};

		Object.freeze(env);
		Object.freeze(env.DATABASE);
		Object.freeze(env.API);

		const result = applyCoercion(env, [
			{ path: ["DATABASE", "port"], type: "primitive" },
			{ path: ["API", "retries"], type: "primitive" },
		]) as typeof env;

		expect(result).toEqual({
			DATABASE: {
				host: "localhost",
				port: 3000,
			},
			API: {
				url: "http://localhost",
				retries: 3,
			},
		});

		expect(result).not.toBe(env);
		expect(result.DATABASE).not.toBe(env.DATABASE);
		expect(result.API).not.toBe(env.API);
	});

	it("should not mutate the original object", () => {
		const env = {
			DATABASE: {
				host: "localhost",
				port: "3000",
			},
		};

		const result = applyCoercion(env, [
			{ path: ["DATABASE", "port"], type: "primitive" },
		]) as typeof env;

		expect(env.DATABASE.port).toBe("3000"); // Original remains untouched
		expect(result.DATABASE.port).toBe(3000);
	});

	it("should preserve reference equality for untouched subtrees", () => {
		const env = {
			DATABASE: {
				host: "localhost",
				port: "3000",
			},
			UNTOUCHED: {
				foo: "bar",
			},
		};

		const result = applyCoercion(env, [
			{ path: ["DATABASE", "port"], type: "primitive" },
		]) as typeof env;

		expect(result.DATABASE.port).toBe(3000);
		expect(result.UNTOUCHED).toBe(env.UNTOUCHED); // Structural sharing holds
	});

	it("should handle arrays cleanly without in-place mutation and with structural sharing", () => {
		const env = {
			ports: ["3000", "4000"],
			tags: ["a", "b"],
		};

		Object.freeze(env);
		Object.freeze(env.ports);
		Object.freeze(env.tags);

		const result = applyCoercion(env, [
			{ path: ["ports", "*"], type: "primitive" },
		]) as typeof env;

		expect(result.ports).toEqual([3000, 4000]);
		expect(result.tags).toBe(env.tags); // Untouched array retains reference
	});
});

