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
 * Always uses the env-module transform: `arkenv()` / `arkenv({ schemaPath, clientPrefix })`.
 * The schema/`define` signature is rejected.
 *
 * The returned `hybrid` is the factory with transform `setup`/`target` attached so
 * `bunfig.toml` / default-import usage (`plugins = ["@arkenv/bun-plugin"]`) enables
 * zero-config transform mode.
 *
 * @param pluginName The Bun plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns An object containing the configured arkenv factory and the hybrid plugin
 */
export function createBunPlugin(
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	/**
	 * Create a Bun plugin that rewrites `env.ts` in browser bundles.
	 *
	 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
	 * @returns A configured Bun plugin
	 */
	function arkenv(
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

	const hybrid = arkenv as typeof arkenv & BunPlugin;

	Object.defineProperty(hybrid, "name", {
		value: pluginName,
		writable: false,
	});
	Object.defineProperty(hybrid, "target", {
		value: "browser",
		writable: false,
	});
	hybrid.setup = zeroConfigTransform.setup;

	return { arkenv, hybrid };
}
