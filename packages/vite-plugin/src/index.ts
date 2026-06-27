import type { ArkEnvConfig, EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { Plugin } from "vite";
import { createVitePlugin } from "./vite-plugin-generic";

export type { ImportMetaEnvAugmented } from "./types";

const arkenvCreator = createVitePlugin(coreArkenv, "@arkenv/vite-plugin");

/**
 * Vite plugin to validate environment variables using ArkEnv and expose them to client code.
 *
 * @param options - The environment variable schema definition.
 * @param arkenvConfig - Optional ArkEnv configuration (e.g. `coerce`, `onUndeclaredKey`).
 */
export default function arkenv(
	options: CompiledEnvSchema,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): Plugin {
	return arkenvCreator(options, arkenvConfig);
}
