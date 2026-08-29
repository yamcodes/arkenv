import {
	beginSchemaCapture,
	endSchemaCapture,
	isCapturingSchema,
} from "@repo/utils";
import { afterEach, describe, expect, it } from "vitest";
import { arkenv } from "@";

describe("schema capture", () => {
	afterEach(() => {
		endSchemaCapture();
	});

	it("records schema keys without validating process.env", () => {
		beginSchemaCapture();
		const env = arkenv({
			DATABASE_URL: "string",
			PORT: "number = 3000",
		});
		expect(env).toEqual({});
		expect(env.DATABASE_URL).toBeUndefined();
		expect(isCapturingSchema()).toBe(true);
		expect(endSchemaCapture()).toEqual([
			{
				DATABASE_URL: "string",
				PORT: "number = 3000",
			},
		]);
	});

	it("leaves normal validation unchanged after capture ends", () => {
		beginSchemaCapture();
		arkenv({ MISSING: "string" });
		endSchemaCapture();

		expect(() => arkenv({ MISSING: "string" })).toThrow();
		expect(
			arkenv({ PRESENT: "string" }, { env: { PRESENT: "ok" } }).PRESENT,
		).toBe("ok");
	});

	it("uses Symbol.for handshake isolated from Nuxt's legacy string key", () => {
		const legacyKey = "__ARKENV_SCHEMA_CAPTURE__";
		const globals = globalThis as unknown as Record<string, unknown>;
		globals[legacyKey] = {
			capturing: true,
			captures: ["nuxt-poison"],
		};

		beginSchemaCapture();
		expect(isCapturingSchema()).toBe(true);
		arkenv({ PORT: "number" });
		expect(endSchemaCapture()).toEqual([{ PORT: "number" }]);
		expect(globals[legacyKey]).toEqual({
			capturing: true,
			captures: ["nuxt-poison"],
		});
		delete globals[legacyKey];
	});
});
