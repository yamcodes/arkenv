import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import type { BunPlugin } from "bun";
import { createBunPlugin } from "./bun-plugin-generic";

const { arkenv: arkenvFn, hybrid: hybridObj } = createBunPlugin(
	coreArkenv,
	"@arkenv/bun-plugin/standard",
);

/**
 * Bun plugin to validate environment variables using Standard Schema.
 */
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	options: T,
	arkenvConfig?: Omit<StandardEnvConfig, "safe">,
): BunPlugin {
	return arkenvFn(options, arkenvConfig);
}

export const hybrid = hybridObj as typeof arkenv & BunPlugin;
export default hybrid;
