import { describe, expect, it } from "vitest";
import { SCHEMA_DEFINE_REMOVED } from "./env-module.js";
import arkenvPluginDefault, {
	arkenvPlugin,
	arkenvVitePlugin,
} from "./index.js";
import arkenvPluginStandardDefault, {
	arkenvPlugin as arkenvPluginStandard,
	arkenvVitePlugin as arkenvVitePluginStandard,
} from "./standard.js";

describe("plugin factory", () => {
	it("is a function that returns a transform plugin", () => {
		expect(typeof arkenvPluginDefault).toBe("function");
		expect(arkenvPluginDefault).toBe(arkenvPlugin);
		expect(arkenvPluginDefault).toBe(arkenvVitePlugin);

		const plugin = arkenvPluginDefault();
		expect(plugin).toHaveProperty("name", "@arkenv/vite-plugin");
		expect(plugin).toHaveProperty("enforce", "pre");
		expect(plugin).toHaveProperty("transform");
	});

	it("exports arkenvPlugin and arkenvVitePlugin named exports identically", () => {
		const pluginNamed = arkenvPlugin();
		const pluginAlias = arkenvVitePlugin();
		expect(pluginNamed.name).toBe("@arkenv/vite-plugin");
		expect(pluginAlias.name).toBe("@arkenv/vite-plugin");
	});

	it("supports the /standard subpath with the same export interface", () => {
		expect(typeof arkenvPluginStandardDefault).toBe("function");
		expect(arkenvPluginStandardDefault).toBe(arkenvPluginStandard);
		expect(arkenvPluginStandardDefault).toBe(arkenvVitePluginStandard);

		const standardPlugin = arkenvPluginStandardDefault();
		expect(standardPlugin).toHaveProperty(
			"name",
			"@arkenv/vite-plugin/standard",
		);
		expect(standardPlugin).toHaveProperty("enforce", "pre");
		expect(standardPlugin).toHaveProperty("transform");
	});

	it("treats an empty options object as transform mode", () => {
		const plugin = arkenvPluginDefault({});
		expect(plugin).toHaveProperty("transform");
	});

	it("rejects the removed schema/define signature", () => {
		const plugin = arkenvPluginDefault as (a?: unknown, b?: unknown) => unknown;
		expect(() => plugin({ VITE_TEST: "string" })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
		expect(() => plugin({ VITE_TEST: "string" }, { coerce: false })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
	});
});
