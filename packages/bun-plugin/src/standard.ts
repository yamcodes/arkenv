import type { StandardEnvConfig } from "@arkenv/standard";
import { arkenv as coreArkenv } from "@arkenv/standard";
import type { ArkEnvLogOptions } from "@repo/log";
import type { StandardSchemaV1 } from "@repo/types";
import type { BunPlugin } from "bun";
import {
	type BunPluginFactoryConfig,
	createBunPlugin,
} from "./bun-plugin-generic";
import type { BunTransformOptions } from "./env-module";

export type { BunTransformOptions };

type BunPluginConfig = Omit<StandardEnvConfig, "safe"> & ArkEnvLogOptions;

const { arkenv: arkenvFn, hybrid: hybridObj } = createBunPlugin(
	coreArkenv,
	"@arkenv/bun-plugin/standard",
);

/**
 * Bun plugin (Standard Schema) — transform path: rewrite `env.ts` in browser bundles.
 *
 * @param options Transform options (`schemaPath`, `clientPrefix`) plus ArkEnv/logging config
 * @returns The Bun plugin instance
 *
 * @remarks
 * ADR 0021: env.ts is the canonical surface. Do not add `env.gen.ts` codegen or
 * client-side re-validation on this host.
 */
export function arkenv(options?: BunPluginFactoryConfig): BunPlugin;
/**
 * Bun plugin (Standard Schema) — schema/SPA path: validate and rewrite `process.env`.
 *
 * @param options The environment variable schema definition map
 * @param config Optional ArkEnv configuration and build-time logging options
 * @returns The Bun plugin instance
 */
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	options: T,
	config?: BunPluginConfig,
): BunPlugin;
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	options?: T | BunPluginFactoryConfig,
	config?: BunPluginConfig,
): BunPlugin {
	return arkenvFn(options, config);
}

export const hybrid = hybridObj as typeof arkenv & BunPlugin;
export default hybrid;
