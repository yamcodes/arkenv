import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import { loadEnv, type Plugin } from "vite";

export function createVitePlugin(
	coreArkenv: any,
	pluginName: string,
	factoryLogOptions?: ArkEnvLogOptions,
) {
	return function arkenv(
		options: CompiledEnvSchema | any,
		config?: Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions,
	): Plugin {
		const { pluginConfig, logOptions } = splitPluginConfig(config);
		const buildLog = resolveBuildLog({ ...factoryLogOptions, ...logOptions });

		return {
			name: pluginName,
			config(config, { mode }) {
				const envPrefix = config.envPrefix ?? "VITE_";
				const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

				const envDir = config.envDir ?? config.root ?? process.cwd();
				try {
					const env: SchemaShape = coreArkenv(options as any, {
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
					buildLog.logBuildErrorWithCause(
						"Environment validation failed",
						error,
					);
					throw error;
				}
			},
		};
	};
}
