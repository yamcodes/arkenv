import type { Plugin } from "vite";
import type { ViteTransformOptions } from "./env-module";
import {
	createVitePlugin,
	type VitePluginFactoryConfig,
} from "./vite-plugin-generic";

export type { ViteTransformOptions };

const arkenvCreator = createVitePlugin("@arkenv/vite-plugin");

/**
 * Create a Vite plugin that rewrites `env.ts` in the client graph.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
 * @returns The Vite plugin instance
 *
 * @remarks
 * ADR 0021: env.ts is the canonical surface. Do not add `env.gen.ts` codegen,
 * client-side re-validation, or a schema/`define` signature on this host.
 */
export function arkenvPlugin(options?: VitePluginFactoryConfig): Plugin {
	return arkenvCreator(options);
}

export { arkenvPlugin as arkenvVitePlugin };
export default arkenvPlugin;
