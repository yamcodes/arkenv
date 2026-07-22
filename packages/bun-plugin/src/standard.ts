import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { ArkEnvLogOptions } from "@repo/log";
import type { StandardSchemaV1 } from "@repo/types";
import type { BunPlugin } from "bun";
import { createBunPlugin } from "./bun-plugin-generic";

type BunPluginConfig = Omit<StandardEnvConfig, "safe"> & ArkEnvLogOptions;

const { arkenv: arkenvFn, hybrid: hybridObj } = createBunPlugin(
	coreArkenv,
	"@arkenv/bun-plugin/standard",
);

/**
 * Bun plugin to validate environment variables using Standard Schema.
 */
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	options: T,
	config?: BunPluginConfig,
): BunPlugin {
	return arkenvFn(options, config);
}

export const hybrid = hybridObj as typeof arkenv & BunPlugin;
export default hybrid;
