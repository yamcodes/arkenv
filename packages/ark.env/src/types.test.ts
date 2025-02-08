import { describe, expect, it } from "bun:test";
import { host, port } from "./types";

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
