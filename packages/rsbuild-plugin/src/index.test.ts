import { describe, expect, it } from "vitest";
import { SCHEMA_DEFINE_REMOVED } from "./env-module.js";
import arkenvPluginDefault, {
	arkenvPlugin,
	arkenvRsbuildPlugin,
} from "./index.js";
import arkenvPluginStandardDefault, {
	arkenvPlugin as arkenvPluginStandard,
	arkenvRsbuildPlugin as arkenvRsbuildPluginStandard,
} from "./standard.js";

describe("plugin factory", () => {
	it("is a function that returns a transform plugin", () => {
		expect(typeof arkenvPluginDefault).toBe("function");
		expect(arkenvPluginDefault).toBe(arkenvPlugin);
		expect(arkenvPluginDefault).toBe(arkenvRsbuildPlugin);

		const plugin = arkenvPluginDefault();
		expect(plugin).toHaveProperty("name", "@arkenv/rsbuild-plugin");
		expect(plugin).toHaveProperty("setup");
	});

	it("exports arkenvPlugin and arkenvRsbuildPlugin named exports identically", () => {
		const pluginNamed = arkenvPlugin();
		const pluginAlias = arkenvRsbuildPlugin();
		expect(pluginNamed.name).toBe("@arkenv/rsbuild-plugin");
		expect(pluginAlias.name).toBe("@arkenv/rsbuild-plugin");
	});

	it("supports the /standard subpath with the same export interface", () => {
		expect(typeof arkenvPluginStandardDefault).toBe("function");
		expect(arkenvPluginStandardDefault).toBe(arkenvPluginStandard);
		expect(arkenvPluginStandardDefault).toBe(arkenvRsbuildPluginStandard);

		const standardPlugin = arkenvPluginStandardDefault();
		expect(standardPlugin).toHaveProperty(
			"name",
			"@arkenv/rsbuild-plugin/standard",
		);
		expect(standardPlugin).toHaveProperty("setup");
	});

	it("treats an empty options object as transform mode", () => {
		const plugin = arkenvPluginDefault({});
		expect(plugin).toHaveProperty("setup");
	});

	it("rejects the removed schema/define signature", () => {
		const plugin = arkenvPluginDefault as (a?: unknown, b?: unknown) => unknown;
		expect(() => plugin({ PUBLIC_TEST: "string" })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
		expect(() => plugin({ PUBLIC_TEST: "string" }, { coerce: false })).toThrow(
			SCHEMA_DEFINE_REMOVED,
		);
	});
});
