import type { ArkEnvLogOptions } from "@repo/log";
import type { Plugin } from "vite";
import { assertTransformModeCall } from "./env-module";
import type { VitePluginFactoryConfig } from "./plugin-config";
import { createTransformPlugin } from "./transform-plugin";

export type { ViteTransformOptions } from "./env-module";
export type { VitePluginFactoryConfig } from "./plugin-config";

/**
 * Create a Vite plugin factory bound to a plugin name (default or `/standard`).
 *
 * Always uses the env-module transform: `arkenvPlugin()` / `arkenvPlugin({ schemaPath, clientPrefix })`.
 * The schema/`define` signature is rejected.
 *
 * @param pluginName The Vite plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns A plugin factory function
 */
export function createVitePlugin(
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	return function arkenvPlugin(
		options?: VitePluginFactoryConfig,
		unexpected?: unknown,
	): Plugin {
		assertTransformModeCall(options, unexpected);
		return createTransformPlugin(pluginName, options ?? {}, factoryLogOptions);
	};
}
