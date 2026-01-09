import type { EnvSchemaWithType, SchemaShape } from "@repo/types";
import { type EnvSchema, arkenv as validateEnv } from "arkenv";
import { loadEnv, type Plugin } from "vite";

export type { ImportMetaEnvAugmented } from "./types";

/**
 * Vite plugin to validate environment variables using ArkEnv and expose them to client code.
 */
export default function arkenv(options: EnvSchemaWithType): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
): Plugin;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | EnvSchemaWithType,
): Plugin {
	return {
		name: "@arkenv/vite-plugin",
		config(config, { mode }) {
			const envPrefix = config.envPrefix ?? "VITE_";
			const prefixes = Array.isArray(envPrefix) ? envPrefix : [envPrefix];
			const envDir = config.envDir ?? config.root ?? process.cwd();

			const env = validateEnv(options as any, {
				env: loadEnv(mode, envDir, ""),
			});

			const filteredEnv = Object.fromEntries(
				Object.entries(<SchemaShape>env).filter(([key]) =>
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
}
