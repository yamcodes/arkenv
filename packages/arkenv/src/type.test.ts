import { describe, expect, it } from "vitest";
import { type } from "./type";

describe("type", () => {
	it("should create a type from a simple string schema", () => {
		const envType = type({ NODE_ENV: "string" });
		const result = envType.assert({ NODE_ENV: "development" });
		expect(result.NODE_ENV).toBe("development");
	});

	it("should create a type from a number schema", () => {
		const envType = type({ PORT: "number" });
		const result = envType.assert({ PORT: 3000 });
		expect(result.PORT).toBe(3000);
	});

	it("should create a type from a boolean schema", () => {
		const envType = type({ DEBUG: "boolean" });
		const result = envType.assert({ DEBUG: "true" });
		expect(result.DEBUG).toBe(true);
	});

	it("should create a type with optional fields", () => {
		const envType = type({
			REQUIRED: "string",
			OPTIONAL: "string?",
		});

		// Should work with both fields
		const result1 = envType.assert({
			REQUIRED: "value",
			OPTIONAL: "optional-value",
		});
		expect(result1.REQUIRED).toBe("value");
		expect(result1.OPTIONAL).toBe("optional-value");

		// Should work with only required field
		const result2 = envType.assert({ REQUIRED: "value" });
		expect(result2.REQUIRED).toBe("value");
		expect(result2.OPTIONAL).toBeUndefined();
	});

	it("should create a type with arkenv-specific host validation", () => {
		const envType = type({ HOST: "string.host" });

		// Valid IP addresses
		const result1 = envType.assert({ HOST: "127.0.0.1" });
		expect(result1.HOST).toBe("127.0.0.1");

		const result2 = envType.assert({ HOST: "192.168.1.1" });
		expect(result2.HOST).toBe("192.168.1.1");

		// Valid hostname
		const result3 = envType.assert({ HOST: "localhost" });
		expect(result3.HOST).toBe("localhost");

		// Should throw for invalid host
		expect(() => envType.assert({ HOST: "invalid-host" })).toThrow();
	});

	it("should create a type with arkenv-specific port validation", () => {
		const envType = type({ PORT: "number.port" });

		// Valid ports (as strings, like from environment variables)
		const result1 = envType.assert({ PORT: "3000" });
		expect(result1.PORT).toBe(3000);

		const result2 = envType.assert({ PORT: "8080" });
		expect(result2.PORT).toBe(8080);

		const result3 = envType.assert({ PORT: "65535" });
		expect(result3.PORT).toBe(65535);

		// Should throw for invalid ports
		expect(() => envType.assert({ PORT: "invalid" })).toThrow();
		expect(() => envType.assert({ PORT: "-1" })).toThrow();
		expect(() => envType.assert({ PORT: "65536" })).toThrow();
	});

	it("should create a complex type with multiple validations", () => {
		const envType = type({
			API_URL: "string",
			HOST: "string.host",
			PORT: "number.port",
			DEBUG: "boolean",
			API_KEY: "string?",
		});

		const result = envType.assert({
			API_URL: "https://api.example.com",
			HOST: "localhost",
			PORT: "3000",
			DEBUG: "true",
			// API_KEY is optional, so we can omit it
		});

		expect(result.API_URL).toBe("https://api.example.com");
		expect(result.HOST).toBe("localhost");
		expect(result.PORT).toBe(3000);
		expect(result.DEBUG).toBe(true);
		expect(result.API_KEY).toBeUndefined();
	});

	it("should throw when required fields are missing", () => {
		const envType = type({
			REQUIRED: "string",
			ALSO_REQUIRED: "number",
		});

		expect(() => envType.assert({ REQUIRED: "value" })).toThrow();
		expect(() => envType.assert({ ALSO_REQUIRED: "123" })).toThrow();
		expect(() => envType.assert({})).toThrow();
	});

	it("should throw when field types are invalid", () => {
		const envType = type({
			PORT: "number",
			DEBUG: "boolean",
		});

		expect(() => envType.assert({ PORT: "not-a-number" })).toThrow();
		expect(() => envType.assert({ DEBUG: "not-a-boolean" })).toThrow();
		expect(() => envType.assert({ PORT: "123", DEBUG: true })).toThrow();
	});

	it("should work with nested object types", () => {
		const envType = type({
			DATABASE: {
				HOST: "string.host",
				PORT: "number.port",
				NAME: "string",
			},
		});

		const result = envType.assert({
			DATABASE: {
				HOST: "localhost",
				PORT: "5432",
				NAME: "myapp",
			},
		});

		expect(result.DATABASE.HOST).toBe("localhost");
		expect(result.DATABASE.PORT).toBe(5432);
		expect(result.DATABASE.NAME).toBe("myapp");
	});

	it("should work with array types", () => {
		const envType = type({
			ALLOWED_ORIGINS: "string[]",
		});

		const result = envType.assert({
			ALLOWED_ORIGINS: ["localhost", "127.0.0.1", "example.com"],
		});

		expect(Array.isArray(result.ALLOWED_ORIGINS)).toBe(true);
		expect(result.ALLOWED_ORIGINS).toEqual([
			"localhost",
			"127.0.0.1",
			"example.com",
		]);
	});

	it("should validate that the type function returns a proper ArkType", () => {
		const envType = type({
			STRING_VALUE: "string",
			NUMBER_VALUE: "number",
			BOOLEAN_VALUE: "boolean",
		});

		// Test that it's a proper ArkType with assert method
		expect(typeof envType.assert).toBe("function");

		const result = envType.assert({
			STRING_VALUE: "hello",
			NUMBER_VALUE: 42,
			BOOLEAN_VALUE: "true",
		});

		expect(result.STRING_VALUE).toBe("hello");
		expect(result.NUMBER_VALUE).toBe(42);
		expect(result.BOOLEAN_VALUE).toBe(true);
	});
});
