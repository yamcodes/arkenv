import { describe, expect, it } from "vitest";
import { boolean, host, port } from "./types";

describe("port", () => {
	it("should validate a valid port number", () => {
		const result = port.assert("8080");
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

describe("boolean", () => {
	it("should convert 'true' to true", () => {
		const result = boolean.assert("true");
		expect(result).toBe(true);
	});

	it("should convert 'false' to false", () => {
		const result = boolean.assert("false");
		expect(result).toBe(false);
	});

	it("should convert '1' to true", () => {
		const result = boolean.assert("1");
		expect(result).toBe(true);
	});

	it("should convert '0' to false", () => {
		const result = boolean.assert("0");
		expect(result).toBe(false);
	});

	it("should convert 'yes' to true", () => {
		const result = boolean.assert("yes");
		expect(result).toBe(true);
	});

	it("should convert 'no' to false", () => {
		const result = boolean.assert("no");
		expect(result).toBe(false);
	});

	it("should convert 'on' to true", () => {
		const result = boolean.assert("on");
		expect(result).toBe(true);
	});

	it("should convert 'off' to false", () => {
		const result = boolean.assert("off");
		expect(result).toBe(false);
	});

	it("should handle uppercase values", () => {
		expect(boolean.assert("TRUE")).toBe(true);
		expect(boolean.assert("FALSE")).toBe(false);
		expect(boolean.assert("YES")).toBe(true);
		expect(boolean.assert("NO")).toBe(false);
	});

	it("should handle mixed case values", () => {
		expect(boolean.assert("True")).toBe(true);
		expect(boolean.assert("False")).toBe(false);
		expect(boolean.assert("Yes")).toBe(true);
		expect(boolean.assert("No")).toBe(false);
	});

	it("should handle values with whitespace", () => {
		expect(boolean.assert(" true ")).toBe(true);
		expect(boolean.assert(" false ")).toBe(false);
		expect(boolean.assert("\ttrue\t")).toBe(true);
		expect(boolean.assert("\nfalse\n")).toBe(false);
	});

	it("should throw when the value is invalid", () => {
		expect(() => boolean.assert("invalid")).toThrow("a boolean value");
		expect(() => boolean.assert("maybe")).toThrow("a boolean value");
		expect(() => boolean.assert("")).toThrow("a boolean value");
		expect(() => boolean.assert("2")).toThrow("a boolean value");
	});
});
