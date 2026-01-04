import { describe, expect, it } from "vitest";
import { host, maybeParsedJSON, port } from "./index";

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

describe("maybeParsedJSON", () => {
	it("should parse a valid JSON object string", () => {
		const result = maybeParsedJSON('{"key": "value"}');
		expect(result).toEqual({ key: "value" });
	});

	it("should parse a valid JSON array string", () => {
		const result = maybeParsedJSON("[1, 2, 3]");
		expect(result).toEqual([1, 2, 3]);
	});

	it("should parse nested JSON objects", () => {
		const result = maybeParsedJSON('{"nested": {"key": "value"}}');
		expect(result).toEqual({ nested: { key: "value" } });
	});

	it("should return the original string if not valid JSON", () => {
		const result = maybeParsedJSON("not json");
		expect(result).toBe("not json");
	});

	it("should return the original string if it doesn't look like JSON", () => {
		const result = maybeParsedJSON("simple string");
		expect(result).toBe("simple string");
	});

	it("should return the original value if not a string", () => {
		const result = maybeParsedJSON(42);
		expect(result).toBe(42);
	});

	it("should return the original object if already an object", () => {
		const obj = { key: "value" };
		const result = maybeParsedJSON(obj);
		expect(result).toStrictEqual(obj);
	});

	it("should handle JSON strings with whitespace", () => {
		const result = maybeParsedJSON('  {"key": "value"}  ');
		expect(result).toEqual({ key: "value" });
	});
});
