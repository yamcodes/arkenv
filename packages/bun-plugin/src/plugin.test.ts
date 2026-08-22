import { describe, expect, it } from "vitest";
import { SCHEMA_DEFINE_REMOVED } from "./env-module.js";
import { arkenv, hybrid } from "./plugin";

describe("Bun Plugin", () => {
	it("should create a plugin function", () => {
		expect(typeof arkenv).toBe("function");
	});

	it("returns a browser transform plugin", () => {
		const pluginInstance = arkenv();
		expect(pluginInstance).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(pluginInstance).toHaveProperty("setup");
		expect(pluginInstance).toHaveProperty("target", "browser");
		expect(typeof pluginInstance.setup).toBe("function");
	});

	it("treats an empty options object as transform mode", () => {
		const pluginInstance = arkenv({});
		expect(pluginInstance).toHaveProperty("target", "browser");
	});

	it("exposes a hybrid plugin for bunfig.toml default import", () => {
		expect(hybrid).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(hybrid).toHaveProperty("target", "browser");
		expect(typeof hybrid.setup).toBe("function");
	});

	it("rejects the removed schema/define signature", () => {
		const plugin = arkenv as (a?: unknown, b?: unknown) => unknown;
		expect(() => plugin({ BUN_PUBLIC_TEST: "string" })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
		expect(() =>
			plugin({ BUN_PUBLIC_TEST: "string" }, { coerce: false }),
		).toThrow(SCHEMA_DEFINE_REMOVED);
	});
});
