import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import { createEnv, type EnvSchema } from "arkenv";
import type { Loader, PluginBuilder } from "bun";

/**
 * @internal
 * Processes an environment variable schema and returns a map of validated, filtered values.
 */
export function processEnvSchema<T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
): Map<string, string> {
	const env = createEnv<T>(options, { env: process.env });
	const prefix = "BUN_PUBLIC_";
	const filteredEnv = Object.fromEntries(
		Object.entries(<SchemaShape>env).filter(([key]) => key.startsWith(prefix)),
	);
	const envMap = new Map<string, string>();
	for (const [key, value] of Object.entries(filteredEnv)) {
		envMap.set(key, JSON.stringify(value));
	}
	return envMap;
}

/**
 * Helper to register the onLoad handler
 */
export function registerLoader(
	build: PluginBuilder,
	envMap: Map<string, string>,
) {
	build.onLoad({ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ }, async (args) => {
		if (args.path.includes("node_modules")) {
			return undefined;
		}
		try {
			const file = Bun.file(args.path);
			const contents = await file.text();
			let transformed = contents;
			for (const [key, value] of envMap.entries()) {
				const dotPattern = new RegExp(
					`process\\.env\\.${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
					"g",
				);
				transformed = transformed.replace(dotPattern, value);
				const bracketPattern = new RegExp(
					`process\\.env\\[(["'])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1\\]`,
					"g",
				);
				transformed = transformed.replace(bracketPattern, value);
			}
			const loader = (
				args.path.endsWith(".tsx") || args.path.endsWith(".jsx")
					? "tsx"
					: args.path.endsWith(".ts") || args.path.endsWith(".mts")
						? "ts"
						: "js"
			) as Loader;
			return { loader, contents: transformed };
		} catch {
			return undefined;
		}
	});
}
