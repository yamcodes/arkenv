import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import type { Plugin } from "vite";
import { createVitePlugin } from "./vite-plugin-generic";

const arkenvCreator = createVitePlugin(
	coreArkenv,
	"@arkenv/vite-plugin/standard",
);

/**
 * Vite plugin to validate environment variables using Standard Schema and expose them to client code.
 *
 * @param options - The environment variable schema definition map.
 * @param arkenvConfig - Optional ArkEnv configuration (e.g. `coerce`, `onUndeclaredKey`).
 */
export default function arkenv<
	const T extends Record<string, StandardSchemaV1>,
>(options: T, arkenvConfig?: Omit<StandardEnvConfig, "safe">): Plugin {
	return arkenvCreator(options, arkenvConfig);
}
