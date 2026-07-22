import type { ArkEnvLogOptions } from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import type { BunPlugin } from "bun";
import { createDefinePlugin } from "./define-plugin";
import { type BunTransformOptions, isTransformModeCall } from "./env-module";
import type { BunPluginFactoryConfig } from "./plugin-config";
import { createTransformPlugin } from "./transform-plugin";

export type { BunPluginFactoryConfig } from "./plugin-config";
export type { BunTransformOptions };

/**
 * Create a Bun plugin factory bound to a specific ArkEnv runtime (`core` or `standard`).
 *
 * - **Transform** — `arkenv()` / `arkenv({ schemaPath, clientPrefix })`: rewrite the user's
 *   `env.ts` in browser bundles (ADR 0021). Server graphs execute `env.ts` as-is.
 * - **Schema/SPA** — `arkenv(schema, config?)`: build-time validation + `process.env`
 *   rewriting (existing API, unchanged).
 *
 * The returned `hybrid` is the factory with transform `setup`/`target` attached so
 * `bunfig.toml` / default-import usage (`plugins = ["@arkenv/bun-plugin"]`) enables
 * zero-config transform mode.
 *
 * @param coreArkenv The ArkEnv runtime function used for schema/SPA validation
 * @param pluginName The Bun plugin name
 * @param factoryLogOptions Optional default logging options for the factory
 * @returns An object containing the configured arkenv factory and the hybrid plugin
 */
export function createBunPlugin(
	coreArkenv: any,
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	/**
	 * Create a Bun plugin in transform or SPA mode based on the call shape.
	 *
	 * @param schemaOrOptions Transform options, or a schema for SPA mode
	 * @param config Optional ArkEnv config (SPA mode only)
	 * @returns A configured Bun plugin
	 */
	function arkenv(
		schemaOrOptions?: CompiledEnvSchema | SchemaShape | BunPluginFactoryConfig,
		config?: Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions,
	): BunPlugin {
		if (isTransformModeCall(schemaOrOptions, config)) {
			return createTransformPlugin(
				pluginName,
				(schemaOrOptions ?? {}) as BunPluginFactoryConfig,
				factoryLogOptions,
			);
		}

		return createDefinePlugin(
			coreArkenv,
			pluginName,
			schemaOrOptions as CompiledEnvSchema | SchemaShape,
			config,
			factoryLogOptions,
		);
	}

	const zeroConfigTransform = createTransformPlugin(
		pluginName,
		{},
		factoryLogOptions,
	);

	const hybrid = arkenv as typeof arkenv & BunPlugin;

	Object.defineProperty(hybrid, "name", {
		value: pluginName,
		writable: false,
	});
	Object.defineProperty(hybrid, "target", {
		value: "browser",
		writable: false,
	});
	hybrid.setup = zeroConfigTransform.setup;

	return { arkenv, hybrid };
}
