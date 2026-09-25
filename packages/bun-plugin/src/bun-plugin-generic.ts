import type { ArkEnvLogOptions } from "@repo/log";
import type { BunPlugin } from "bun";
import { assertTransformModeCall } from "./env-module";
import type { BunPluginFactoryConfig } from "./plugin-config";
import { createTransformPlugin } from "./transform-plugin";

export type { BunTransformOptions } from "./env-module";
export type { BunPluginFactoryConfig } from "./plugin-config";

/**
 * Create a Bun plugin factory bound to a plugin name (default or `/standard`).
 *
 * Always uses the env-module transform: `arkenvPlugin()` / `arkenvPlugin({ schemaPath, clientPrefix })`.
 * The schema/`define` signature is rejected.
 *
 * The returned factory has transform `setup`/`target` attached so
 * `bunfig.toml` / default-import usage (`plugins = ["@arkenv/bun-plugin"]`) enables
 * zero-config transform mode.
 *
 * @param pluginName The Bun plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns The `arkenvPlugin` factory with zero-config `name`, `target`, and `setup`
 */
export function createBunPlugin(
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	/**
	 * Create a Bun plugin that rewrites `env.ts` in browser bundles.
	 *
	 * @param options Transform options (`schemaPath`, `clientPrefix`) and logging
	 * @returns A configured Bun plugin
	 */
	function arkenvPlugin(
		options?: BunPluginFactoryConfig,
		unexpected?: unknown,
	): BunPlugin {
		assertTransformModeCall(options, unexpected);
		return createTransformPlugin(pluginName, options ?? {}, factoryLogOptions);
	}

	const zeroConfigTransform = createTransformPlugin(
		pluginName,
		{},
		factoryLogOptions,
	);

	const plugin = arkenvPlugin as typeof arkenvPlugin & BunPlugin;

	Object.defineProperty(plugin, "name", {
		value: pluginName,
		writable: false,
	});
	Object.defineProperty(plugin, "target", {
		value: "browser",
		writable: false,
	});
	plugin.setup = zeroConfigTransform.setup;

	return plugin;
}
