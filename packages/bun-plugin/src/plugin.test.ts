import { describe, expect, it } from "vitest";
import { SCHEMA_DEFINE_REMOVED } from "./env-module.js";
import arkenvPluginDefault, {
	arkenvBunPlugin,
	arkenvPlugin,
	hybrid,
} from "./index.js";
import arkenvPluginStandardDefault, {
	arkenvBunPlugin as arkenvBunPluginStandard,
	arkenvPlugin as arkenvPluginStandard,
	hybrid as hybridStandard,
} from "./standard.js";

describe("Bun Plugin", () => {
	it("should export arkenvPlugin as default and named export", () => {
		expect(typeof arkenvPluginDefault).toBe("function");
		expect(arkenvPluginDefault).toBe(arkenvPlugin);
		expect(arkenvPluginDefault).toBe(arkenvBunPlugin);
		expect(arkenvPluginDefault).toBe(hybrid);
	});

	it("returns a browser transform plugin when invoked as a function", () => {
		const pluginInstance = arkenvPlugin();
		expect(pluginInstance).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(pluginInstance).toHaveProperty("setup");
		expect(pluginInstance).toHaveProperty("target", "browser");
		expect(typeof pluginInstance.setup).toBe("function");
	});

	it("treats an empty options object as transform mode", () => {
		const pluginInstance = arkenvPlugin({});
		expect(pluginInstance).toHaveProperty("target", "browser");
	});

	it("exposes a hybrid plugin for bunfig.toml and direct plugin registration", () => {
		expect(arkenvPluginDefault).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(arkenvPluginDefault).toHaveProperty("target", "browser");
		expect(typeof arkenvPluginDefault.setup).toBe("function");

		expect(hybrid).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(hybrid).toHaveProperty("target", "browser");
		expect(typeof hybrid.setup).toBe("function");
	});

	it("supports the /standard subpath with the same export interface", () => {
		expect(typeof arkenvPluginStandardDefault).toBe("function");
		expect(arkenvPluginStandardDefault).toBe(arkenvPluginStandard);
		expect(arkenvPluginStandardDefault).toBe(arkenvBunPluginStandard);
		expect(arkenvPluginStandardDefault).toBe(hybridStandard);

		expect(arkenvPluginStandardDefault).toHaveProperty(
			"name",
			"@arkenv/bun-plugin/standard",
		);
		expect(arkenvPluginStandardDefault).toHaveProperty("target", "browser");
		expect(typeof arkenvPluginStandardDefault.setup).toBe("function");

		const standardInstance = arkenvPluginStandardDefault();
		expect(standardInstance).toHaveProperty(
			"name",
			"@arkenv/bun-plugin/standard",
		);
		expect(standardInstance).toHaveProperty("target", "browser");
	});

	it("rejects the removed schema/define signature", () => {
		const plugin = arkenvPluginDefault as (a?: unknown, b?: unknown) => unknown;
		expect(() => plugin({ BUN_PUBLIC_TEST: "string" })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
		expect(() =>
			plugin({ BUN_PUBLIC_TEST: "string" }, { coerce: false }),
		).toThrow(SCHEMA_DEFINE_REMOVED);
	});
});
