import { describe, expect, it } from "vitest";
import { SCHEMA_DEFINE_REMOVED } from "./env-module.js";
import arkenvPlugin from "./index.js";

describe("plugin factory", () => {
	it("is a function that returns a transform plugin", () => {
		expect(typeof arkenvPlugin).toBe("function");
		const plugin = arkenvPlugin();
		expect(plugin).toHaveProperty("name", "@arkenv/vite-plugin");
		expect(plugin).toHaveProperty("enforce", "pre");
		expect(plugin).toHaveProperty("transform");
	});

	it("treats an empty options object as transform mode", () => {
		const plugin = arkenvPlugin({});
		expect(plugin).toHaveProperty("transform");
	});

	it("rejects the removed schema/define signature", () => {
		const plugin = arkenvPlugin as (a?: unknown, b?: unknown) => unknown;
		expect(() => plugin({ VITE_TEST: "string" })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
		expect(() => plugin({ VITE_TEST: "string" }, { coerce: false })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
	});
});
