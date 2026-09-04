import type { ArkEnvLogOptions } from "@repo/log";
import type { RsbuildPlugin } from "@rsbuild/core";
import { assertTransformModeCall } from "./env-module";
import type { RsbuildPluginFactoryConfig } from "./plugin-config";
import { createTransformPlugin } from "./transform-plugin";

export type { RsbuildTransformOptions } from "./env-module";
export type { RsbuildPluginFactoryConfig } from "./plugin-config";

/**
 * Create an Rsbuild plugin factory bound to a plugin name (default or `/standard`).
 *
 * Always uses the env-module transform: `arkenvPlugin()` / `arkenvPlugin({ schemaPath, clientPrefix })`.
 * The schema/`define` signature is rejected.
 *
 * @param pluginName The Rsbuild plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns A plugin factory function
 */
export function createRsbuildPlugin(
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	return function arkenvPlugin(
		options?: RsbuildPluginFactoryConfig,
		unexpected?: unknown,
	): RsbuildPlugin {
		assertTransformModeCall(options, unexpected);
		return createTransformPlugin(pluginName, options ?? {}, factoryLogOptions);
	};
}
