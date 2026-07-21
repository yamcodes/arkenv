import type { ArkEnvLogOptions } from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import type { Plugin } from "vite";
import { createDefinePlugin } from "./define-plugin";
import { isTransformModeCall, type ViteTransformOptions } from "./env-module";
import type { VitePluginFactoryConfig } from "./plugin-config";
import { createTransformPlugin } from "./transform-plugin";

export type { VitePluginFactoryConfig } from "./plugin-config";
export type { ViteTransformOptions };

/**
 * Create a Vite plugin factory bound to a specific ArkEnv runtime (`core` or `standard`).
 *
 * - **Transform** — `arkenv()` / `arkenv({ schemaPath, clientPrefix })`: rewrite the user's
 *   `env.ts` in the client graph (ADR 0015). Server/SSR graphs execute `env.ts` as-is.
 * - **Schema/`define`** — `arkenv(schema, config?)`: build-time validation + `import.meta.env`
 *   define inlining (existing API, unchanged).
 *
 * @param coreArkenv The ArkEnv runtime function used for schema/`define` validation
 * @param pluginName The Vite plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns A plugin factory function
 */
export function createVitePlugin(
	coreArkenv: any,
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	return function arkenv(
		schemaOrOptions?: CompiledEnvSchema | SchemaShape | VitePluginFactoryConfig,
		config?: Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions,
	): Plugin {
		if (isTransformModeCall(schemaOrOptions, config)) {
			return createTransformPlugin(
				pluginName,
				(schemaOrOptions ?? {}) as VitePluginFactoryConfig,
				factoryLogOptions,
			);
		}

		return createDefinePlugin(
			coreArkenv,
			pluginName,
			schemaOrOptions as CompiledEnvSchema | SchemaShape | undefined,
			config,
			factoryLogOptions,
		);
	};
}
