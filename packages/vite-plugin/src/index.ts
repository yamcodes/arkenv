import type { ArkEnvConfig, EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import type { ArkEnvLogOptions } from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { Plugin } from "vite";
import type { ViteTransformOptions } from "./env-module";
import {
	createVitePlugin,
	type VitePluginFactoryConfig,
} from "./vite-plugin-generic";

export type { ImportMetaEnvAugmented } from "./types";
export type { ViteTransformOptions };

type VitePluginConfig = Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions;

const arkenvCreator = createVitePlugin(coreArkenv, "@arkenv/vite-plugin");

/**
 * Vite plugin — **transform mode**: rewrite `env.ts` in the client graph.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
 * @returns The Vite plugin instance
 *
 * @remarks
 * ADR 0015: env.ts is the canonical surface. Do not add `env.gen.ts` codegen or
 * client-side re-validation on this host.
 */
export default function arkenv(options?: VitePluginFactoryConfig): Plugin;
/**
 * Vite plugin — **SPA mode**: validate and inline `import.meta.env` via `define`.
 *
 * @param options The environment variable schema definition
 * @param config Optional ArkEnv configuration and build-time logging options
 * @returns The Vite plugin instance
 */
export default function arkenv(
	options: CompiledEnvSchema,
	config?: VitePluginConfig,
): Plugin;
/**
 * Vite plugin — **SPA mode**: validate and inline `import.meta.env` via `define`.
 *
 * @param options The environment variable schema definition
 * @param config Optional ArkEnv configuration and build-time logging options
 * @returns The Vite plugin instance
 */
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	config?: VitePluginConfig,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options?: EnvSchema<T> | CompiledEnvSchema | VitePluginFactoryConfig,
	config?: VitePluginConfig,
): Plugin {
	return arkenvCreator(options, config);
}
