import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import { loadEnv, type Plugin } from "vite";
import { normalizePrefixes } from "./env-module-path";

/**
 * Build the legacy schema → Vite `define` plugin (import.meta.env inlining).
 *
 * @param coreArkenv The ArkEnv runtime used to validate and coerce the schema
 * @param pluginName The Vite plugin name
 * @param schema The environment schema passed to `arkenv(schema)`
 * @param config Optional ArkEnv + logging config
 * @param factoryLogOptions Default logging options from the factory
 * @returns A Vite plugin that sets `define` for prefixed keys
 */
export function createDefinePlugin(
	coreArkenv: any,
	pluginName: string,
	schema: CompiledEnvSchema | SchemaShape | undefined,
	config: (Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions) | undefined,
	factoryLogOptions?: ArkEnvLogOptions,
): Plugin {
	const { pluginConfig, logOptions } = splitPluginConfig(config);
	const buildLog = resolveBuildLog({
		...factoryLogOptions,
		...logOptions,
	});

	return {
		name: pluginName,
		config(viteConfig, { mode }) {
			const envPrefix = viteConfig.envPrefix ?? "VITE_";
			const prefixes = normalizePrefixes(envPrefix);

			const envDir =
				typeof viteConfig.envDir === "string"
					? viteConfig.envDir
					: (viteConfig.root ?? process.cwd());
			try {
				const env: SchemaShape = coreArkenv(schema as any, {
					...pluginConfig,
					env: pluginConfig?.env ?? loadEnv(mode, envDir, ""),
					safe: false,
				});

				const filteredEnv = Object.fromEntries(
					Object.entries(env).filter(([key]) =>
						prefixes.some((prefix) => key.startsWith(prefix)),
					),
				);

				const define = Object.fromEntries(
					Object.entries(filteredEnv).map(([key, value]) => [
						`import.meta.env.${key}`,
						JSON.stringify(value),
					]),
				);

				return { define };
			} catch (error: unknown) {
				buildLog.logBuildErrorWithCause("Environment validation failed", error);
				throw error;
			}
		},
	};
}
