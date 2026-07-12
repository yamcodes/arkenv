import type { ArkEnvConfig, EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import type { ArkEnvLogOptions } from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { Plugin } from "vite";
import { createVitePlugin } from "./vite-plugin-generic";

export type { ImportMetaEnvAugmented } from "./types";

type VitePluginConfig = Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions;

const arkenvCreator = createVitePlugin(coreArkenv, "@arkenv/vite-plugin");

/**
 * Vite plugin to validate environment variables using ArkEnv and expose them to client code.
 *
 * @param options - The environment variable schema definition.
 * @param config - Optional ArkEnv configuration and build-time logging options.
 */
export default function arkenv(
	options: CompiledEnvSchema,
	config?: VitePluginConfig,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	config?: VitePluginConfig,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	config?: VitePluginConfig,
): Plugin {
	return arkenvCreator(options, config);
}
