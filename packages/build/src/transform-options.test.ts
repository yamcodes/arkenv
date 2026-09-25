import { describe, expect, it } from "vitest";
import {
	assertTransformModeCall,
	isTransformModeCall,
	pluginOptionNotSupportedMessage,
	SCHEMA_DEFINE_REMOVED,
	TRANSFORM_OPTION_KEYS,
} from "./transform-options";

describe("isTransformModeCall", () => {
	it("detects transform-mode calls", () => {
		expect(isTransformModeCall(undefined, undefined)).toBe(true);
		expect(isTransformModeCall({}, undefined)).toBe(true);
		expect(isTransformModeCall({ schemaPath: "src/env.ts" }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({ clientPrefix: "VITE_" }, undefined)).toBe(
			true,
		);
		expect(
			isTransformModeCall(
				{ schemaPath: "env.ts", clientPrefix: ["VITE_", "PUBLIC_"] },
				undefined,
			),
		).toBe(true);
		expect(isTransformModeCall({ env: { PORT: "3000" } }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({ logLevel: "silent" }, undefined)).toBe(true);
	});

	it("returns false for schema definitions, runtime options, or two-argument calls", () => {
		expect(isTransformModeCall({ VITE_API_URL: "string" }, undefined)).toBe(
			false,
		);
		expect(
			isTransformModeCall({ VITE_API_URL: "string" }, { coerce: true }),
		).toBe(false);
		expect(isTransformModeCall({ coerce: true }, undefined)).toBe(false);
		expect(isTransformModeCall({ toJsonSchema: () => ({}) }, undefined)).toBe(
			false,
		);
		expect(isTransformModeCall(null, undefined)).toBe(false);
		expect(isTransformModeCall("string", undefined)).toBe(false);
	});

	it("limits allowed keys to build-time plugin options", () => {
		expect([...TRANSFORM_OPTION_KEYS].sort()).toEqual(
			["clientPrefix", "env", "logLevel", "logger", "schemaPath"].sort(),
		);
	});
});

describe("assertTransformModeCall", () => {
	it("accepts a build-time env override", () => {
		expect(() =>
			assertTransformModeCall(
				{ env: { VITE_API_URL: "https://api.example.com" } },
				undefined,
			),
		).not.toThrow();
	});

	it("rejects runtime validation keys as plugin options", () => {
		for (const key of [
			"coerce",
			"toJsonSchema",
			"onUndeclaredKey",
			"arrayFormat",
			"emptyAsUndefined",
			"debugSecrets",
		]) {
			expect(() => assertTransformModeCall({ [key]: true }, undefined)).toThrow(
				pluginOptionNotSupportedMessage([key]),
			);
			expect(() =>
				assertTransformModeCall({ [key]: true }, undefined),
			).not.toThrow(SCHEMA_DEFINE_REMOVED);
		}
		expect(
			pluginOptionNotSupportedMessage(["coerce", "arrayFormat"]),
		).toContain("are not plugin options");
	});

	it("still rejects a schema map and a two-argument call as the removed API", () => {
		expect(() =>
			assertTransformModeCall({ VITE_API_URL: "string" }, undefined),
		).toThrow(SCHEMA_DEFINE_REMOVED);
		expect(() =>
			assertTransformModeCall({ VITE_API_URL: "string" }, { coerce: true }),
		).toThrow(SCHEMA_DEFINE_REMOVED);
	});
});
