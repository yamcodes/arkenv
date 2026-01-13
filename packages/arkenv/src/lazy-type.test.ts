import { describe, expect, it, afterEach } from "vitest";
import { lazyType, resetScope } from "@repo/scope";

describe("LazyType Proxy", () => {
	afterEach(() => {
		resetScope();
	});

	it("should throw an error if .pipe() is called after realization via property access", () => {
		const schema = lazyType("string");

		// Accessing 'json' realizes the type
		const _ = (schema as any).json;

		// Now '.pipe()' should throw
		expect(() => {
			(schema as any).pipe((v: any) => v + "!");
		}).toThrow("Cannot pipe after the lazy type has been realized");
	});

	it("should throw an error if .pipe() is called after realization via apply", () => {
		const schema = lazyType("string");

		// Calling it realizes the type
		schema("test");

		// Now '.pipe()' should throw
		expect(() => {
			(schema as any).pipe((v: any) => v + "!");
		}).toThrow("Cannot pipe after the lazy type has been realized");
	});

	it("should allow chaining .pipe() calls before realization", () => {
		const schema = lazyType("string")
			.pipe((v: any) => v + "!")
			.pipe((v: any) => v + "?") as any;

		// Still not realized
		expect(schema.isArktype).toBe(true);

		const result = schema("test");
		expect(result).toBe("test!?");
	});
});
