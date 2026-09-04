import type { RsbuildPlugin } from "@rsbuild/core";
import type { RsbuildTransformOptions } from "./env-module";
import {
	createRsbuildPlugin,
	type RsbuildPluginFactoryConfig,
} from "./rsbuild-plugin-generic";

export type { RsbuildTransformOptions };

const arkenvCreator = createRsbuildPlugin("@arkenv/rsbuild-plugin/standard");

/**
 * Create an Rsbuild plugin (Standard Schema) that rewrites `env.ts` in client environments.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
 * @returns The Rsbuild plugin instance
 */
export function arkenvPlugin(
	options?: RsbuildPluginFactoryConfig,
): RsbuildPlugin {
	return arkenvCreator(options);
}

export { arkenvPlugin as arkenvRsbuildPlugin };
export default arkenvPlugin;
