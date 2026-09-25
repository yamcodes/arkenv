import { describe, expect, it } from "vitest";
import {
	pluginOptionNotSupportedMessage,
	SCHEMA_DEFINE_REMOVED,
} from "./env-module.js";
import * as viteEntry from "./index.js";
import arkenvPluginDefault, { arkenvPlugin } from "./index.js";
import * as viteStandard from "./standard.js";
import arkenvPluginStandardDefault, {
	arkenvPlugin as arkenvPluginStandard,
} from "./standard.js";

describe("plugin factory", () => {
	it("is a function that returns a transform plugin", () => {
		expect(typeof arkenvPluginDefault).toBe("function");
		expect(arkenvPluginDefault).toBe(arkenvPlugin);
		expect(Object.keys(viteEntry).sort()).toEqual(["arkenvPlugin", "default"]);

		const plugin = arkenvPluginDefault();
		expect(plugin).toHaveProperty("name", "@arkenv/vite-plugin");
		expect(plugin).toHaveProperty("enforce", "pre");
		expect(plugin).toHaveProperty("transform");
	});

	it("exports named arkenvPlugin identically to the default", () => {
		const pluginNamed = arkenvPlugin();
		expect(pluginNamed.name).toBe("@arkenv/vite-plugin");
		expect(arkenvPlugin).toBe(arkenvPluginDefault);
	});

	it("supports the /standard subpath with the same export interface", () => {
		expect(typeof arkenvPluginStandardDefault).toBe("function");
		expect(arkenvPluginStandardDefault).toBe(arkenvPluginStandard);
		expect(Object.keys(viteStandard).sort()).toEqual([
			"arkenvPlugin",
			"default",
		]);

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

	it("rejects runtime validation options", () => {
		const plugin = arkenvPluginDefault as (a?: unknown) => unknown;
		expect(() =>
			plugin({ env: { VITE_API_URL: "https://api.example.com" } }),
		).toThrow(pluginOptionNotSupportedMessage(["env"]));
		expect(() => plugin({ coerce: true })).toThrow(
			pluginOptionNotSupportedMessage(["coerce"]),
		);
		expect(() => plugin({ toJsonSchema: () => ({}) })).toThrow(
			pluginOptionNotSupportedMessage(["toJsonSchema"]),
		);
	});
});
