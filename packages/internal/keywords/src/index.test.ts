import { describe, expect, it } from "vitest";
import {
	booleanArray,
	host,
	jsonArray,
	mixedArray,
	numberArray,
	port,
	stringArray,
} from "./index";

describe("port", () => {
	it("should validate a valid port number", () => {
		const result = port.assert(8080);
		expect(result).toBe(8080);
	});

	it("should throw when the port is not a number", () => {
		expect(() => port.assert("invalid")).toThrow();
	});

	it("should throw when the port is negative", () => {
		expect(() => port.assert("-2")).toThrow();
	});

	it("should throw when the port is too large", () => {
		expect(() => port.assert("65536")).toThrow();
	});
});

describe("host", () => {
	it("should validate a valid IP address", () => {
		const result = host.assert("127.0.0.1");
		expect(result).toBe("127.0.0.1");
	});

	it("should validate localhost", () => {
		const result = host.assert("localhost");
		expect(result).toBe("localhost");
	});

	it("should throw when the host is invalid", () => {
		expect(() => host.assert("invalid")).toThrow();
	});
});

describe("stringArray", () => {
	it("should parse comma-separated strings", () => {
		expect(stringArray.assert("a,b,c")).toEqual(["a", "b", "c"]);
	});

	it("should trim whitespace", () => {
		expect(stringArray.assert(" a , b , c ")).toEqual(["a", "b", "c"]);
	});

	it("should handle empty string", () => {
		expect(stringArray.assert("")).toEqual([]);
		expect(stringArray.assert("   ")).toEqual([]);
	});

	it("should pass through existing string arrays", () => {
		expect(stringArray.assert(["a", "b"])).toEqual(["a", "b"]);
	});
});

describe("numberArray", () => {
	it("should parse comma-separated numbers", () => {
		expect(numberArray.assert("1,2,3")).toEqual([1, 2, 3]);
		expect(numberArray.assert("1.5, 2.5")).toEqual([1.5, 2.5]);
	});

	it("should throw on invalid numbers", () => {
		expect(() => numberArray.assert("1,foo,3")).toThrow("Expected a number");
	});

	it("should handle empty string", () => {
		expect(numberArray.assert("")).toEqual([]);
	});

	it("should pass through existing number arrays", () => {
		expect(numberArray.assert([1, 2])).toEqual([1, 2]);
	});
});

describe("booleanArray", () => {
	it("should parse comma-separated booleans", () => {
		expect(booleanArray.assert("true,false,true")).toEqual([true, false, true]);
	});

	it("should throw on invalid booleans", () => {
		expect(() => booleanArray.assert("true,foo")).toThrow("Expected a boolean");
	});

	it("should handle empty string", () => {
		expect(booleanArray.assert("")).toEqual([]);
	});

	it("should pass through existing boolean arrays", () => {
		expect(booleanArray.assert([true, false])).toEqual([true, false]);
	});
});

describe("jsonArray", () => {
	it("should parse JSON array", () => {
		expect(jsonArray.assert('["a","b"]')).toEqual(["a", "b"]);
	});

	it("should throw if not an array", () => {
		expect(() => jsonArray.assert('{"a":1}')).toThrow("Expected a JSON array");
	});

	it("should throw on invalid json", () => {
		expect(() => jsonArray.assert("invalid")).toThrow();
	});
});

describe("mixedArray", () => {
	it("should parse mixed values", () => {
		expect(mixedArray.assert("1,true,foo")).toEqual([1, true, "foo"]);
	});

	it("should parse number-like strings as numbers", () => {
		expect(mixedArray.assert("1.5, -10")).toEqual([1.5, -10]);
	});

	it("should parse boolean-like strings as booleans bit not loose values", () => {
		expect(mixedArray.assert("true, FALSE")).toEqual([true, "FALSE"]);
	});

	it("should parse quoted strings as strings if they don't match other types", () => {
		expect(mixedArray.assert("'true', \"1\"")).toEqual(["'true'", '"1"']);
	});

	it("should handle empty string", () => {
		expect(mixedArray.assert("")).toEqual([]);
	});

	it("should pass through existing arrays", () => {
		expect(mixedArray.assert([1, "a", true])).toEqual([1, "a", true]);
	});
});
