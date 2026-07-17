import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { ArkEnvLogOptions } from "@repo/log";
import type { StandardSchemaV1 } from "@repo/types";
import type { Plugin } from "vite";
import { createVitePlugin } from "./vite-plugin-generic";

type VitePluginConfig = Omit<StandardEnvConfig, "safe"> & ArkEnvLogOptions;

const arkenvCreator = createVitePlugin(
	coreArkenv,
	"@arkenv/vite-plugin/standard",
);

/**
 * Vite plugin to validate environment variables using Standard Schema and expose them to client code.
 *
 * @param options - The environment variable schema definition map.
 * @param config - Optional ArkEnv configuration and build-time logging options.
 */
export default function arkenv<
	const T extends Record<string, StandardSchemaV1>,
>(options: T, config?: VitePluginConfig): Plugin {
	return arkenvCreator(options, config);
}
