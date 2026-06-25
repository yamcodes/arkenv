import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import { loadEnv, type Plugin } from "vite";

export function createVitePlugin(coreArkenv: any, pluginName: string) {
	return function arkenv(
		options: CompiledEnvSchema | any,
		arkenvConfig?: Omit<ArkEnvConfig, "safe">,
	): Plugin {
		return {
			name: pluginName,
			config(config, { mode }) {
				const envPrefix = config.envPrefix ?? "VITE_";
				const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

				const envDir = config.envDir ?? config.root ?? process.cwd();
				const env: SchemaShape = coreArkenv(options as any, {
					...arkenvConfig,
					env: arkenvConfig?.env ?? loadEnv(mode, envDir, ""),
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
			},
		};
	};
}
