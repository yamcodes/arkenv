import type { BunPlugin } from "bun";
import {
	type BunPluginFactoryConfig,
	createBunPlugin,
} from "./bun-plugin-generic";
import type { BunTransformOptions } from "./env-module";

export type { BunTransformOptions };

const arkenvPluginInstance = createBunPlugin("@arkenv/bun-plugin/standard");

/**
 * Create a Bun plugin (Standard Schema) that rewrites `env.ts` in browser bundles.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) and logging
 * @returns The Bun plugin instance
 */
export const arkenvPlugin: ((options?: BunPluginFactoryConfig) => BunPlugin) &
	BunPlugin = arkenvPluginInstance;

export default arkenvPlugin;
