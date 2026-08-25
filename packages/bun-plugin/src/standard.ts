import type { BunPlugin } from "bun";
import {
	type BunPluginFactoryConfig,
	createBunPlugin,
} from "./bun-plugin-generic";
import type { BunTransformOptions } from "./env-module";

export type { BunTransformOptions };

const { arkenvPlugin: arkenvPluginInstance, hybrid: hybridObj } =
	createBunPlugin("@arkenv/bun-plugin/standard");

/**
 * Create a Bun plugin (Standard Schema) that rewrites `env.ts` in browser bundles.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
 * @returns The Bun plugin instance
 *
 * @remarks
 * ADR 0021: env.ts is the canonical surface. Do not add `env.gen.ts` codegen,
 * client-side re-validation, or a schema/`define` signature on this host.
 */
export const arkenvPlugin: ((options?: BunPluginFactoryConfig) => BunPlugin) &
	BunPlugin = arkenvPluginInstance;

export const hybrid = hybridObj;
export const arkenvBunPlugin = arkenvPlugin;
export default arkenvPlugin;
