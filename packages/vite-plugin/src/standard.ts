import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { ArkEnvLogOptions } from "@repo/log";
import type { StandardSchemaV1 } from "@repo/types";
import type { Plugin } from "vite";
import type { ViteTransformOptions } from "./env-module";
import {
	createVitePlugin,
	type VitePluginFactoryConfig,
} from "./vite-plugin-generic";

export type { ViteTransformOptions };

type VitePluginConfig = Omit<StandardEnvConfig, "safe"> & ArkEnvLogOptions;

const arkenvCreator = createVitePlugin(
	coreArkenv,
	"@arkenv/vite-plugin/standard",
);

/**
 * Vite plugin (Standard Schema) — **transform mode**: rewrite `env.ts` in the client graph.
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
 * Vite plugin (Standard Schema) — **SPA mode**: validate and inline `import.meta.env`.
 *
 * @param options The environment variable schema definition map
 * @param config Optional ArkEnv configuration and build-time logging options
 * @returns The Vite plugin instance
 */
export default function arkenv<
	const T extends Record<string, StandardSchemaV1>,
>(options: T, config?: VitePluginConfig): Plugin;
export default function arkenv<
	const T extends Record<string, StandardSchemaV1>,
>(options?: T | VitePluginFactoryConfig, config?: VitePluginConfig): Plugin {
	return arkenvCreator(options, config);
}
