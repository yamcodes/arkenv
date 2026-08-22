import { describe, expect, it } from "vitest";
import { isTransformModeCall } from "./transform-options";

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
	});

	it("returns false for schema definitions or two-argument calls", () => {
		expect(isTransformModeCall({ VITE_API_URL: "string" }, undefined)).toBe(
			false,
		);
		expect(
			isTransformModeCall({ VITE_API_URL: "string" }, { coerce: true }),
		).toBe(false);
		expect(isTransformModeCall(null, undefined)).toBe(false);
		expect(isTransformModeCall("string", undefined)).toBe(false);
	});
});
