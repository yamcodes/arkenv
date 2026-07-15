import type { ArkEnvConfig, EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import type { ArkEnvLogOptions } from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { BunPlugin } from "bun";
import { createBunPlugin } from "./bun-plugin-generic";

type BunPluginConfig = Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions;

const { arkenv: arkenvFn, hybrid: hybridObj } = createBunPlugin(
	coreArkenv,
	"@arkenv/bun-plugin",
);

export function arkenv(
	options: CompiledEnvSchema,
	config?: BunPluginConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	config?: BunPluginConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	config?: BunPluginConfig,
): BunPlugin {
	return arkenvFn(options, config);
}

export const hybrid = hybridObj as typeof arkenv & BunPlugin;
