import type { ArkEnvConfig, EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { BunPlugin } from "bun";
import { createBunPlugin } from "./bun-plugin-generic";

const { arkenv: arkenvFn, hybrid: hybridObj } = createBunPlugin(
	coreArkenv,
	"@arkenv/bun-plugin",
);

export function arkenv(
	options: CompiledEnvSchema,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	arkenvConfig?: Omit<ArkEnvConfig, "safe">,
): BunPlugin {
	return arkenvFn(options, arkenvConfig);
}

export const hybrid = hybridObj as typeof arkenv & BunPlugin;
