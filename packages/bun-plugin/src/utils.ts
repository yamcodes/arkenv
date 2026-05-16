import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import { type ArkEnvConfig, createEnv, type EnvSchema } from "arkenv";
import type { Loader, PluginBuilder } from "bun";

/**
 * @internal
 * Processes an environment variable schema and returns a map of validated, filtered values.
 */
export function processEnvSchema<T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	config?: ArkEnvConfig & { publicPrefix?: string },
): Map<string, string> {
	// Type assertion needed on `options` to avoid TS2589 (excessively deep type instantiation)
	// from ArkType's generic inference on the union type
	const env: SchemaShape = createEnv(options as any, {
		...config,
		env: config?.env ?? process.env,
	});

	// If publicPrefix is explicitly null or empty, we expose everything (server mode)
	const prefix = config?.publicPrefix ?? "BUN_PUBLIC_";
	const allowed = new Set(["NODE_ENV"]);

	const filteredEnv = Object.fromEntries(
		Object.entries(env).filter(
			([key]) => !prefix || allowed.has(key) || key.startsWith(prefix),
		),
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
	onBeforeLoad?: (path: string) => Promise<void>,
) {
	build.onLoad(
		{ filter: /\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$/ },
		async (args) => {
			if (args.path.includes("node_modules")) {
				return undefined;
			}

			if (onBeforeLoad) {
				await onBeforeLoad(args.path);
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
						: args.path.endsWith(".ts") ||
								args.path.endsWith(".mts") ||
								args.path.endsWith(".cts")
							? "ts"
							: "js"
				) as Loader;
				return { loader, contents: transformed };
			} catch {
				return undefined;
			}
		},
	);
}
