import { join } from "node:path";
import type { EnvSchemaWithType, SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import { arkenv } from "arkenv";
import type { BunPlugin, Loader, PluginBuilder } from "bun";

export type { ProcessEnvAugmented } from "./types";

/**
 * Helper to process env schema and return envMap
 */
export function processEnvSchema<T extends SchemaShape>(
	options: EnvSchema<T> | EnvSchemaWithType,
): Map<string, string> {
	// Validate environment variables

	// TODO: We're using type assertions and explicitly pass in the type arguments here to avoid
	// "Type instantiation is excessively deep and possibly infinite" errors.
	// Ideally, we should find a way to avoid these assertions while maintaining type safety.

	const env = arkenv(options as any, { env: process.env });

	// Get Bun's prefix for client-exposed environment variables
	const prefix = "BUN_PUBLIC_";

	// Filter to only include environment variables matching the prefix
	const filteredEnv = Object.fromEntries(
		Object.entries(<SchemaShape>env).filter(([key]) => key.startsWith(prefix)),
	);

	// Create a map of variable names to their JSON-stringified values
	const envMap = new Map<string, string>();
	for (const [key, value] of Object.entries(filteredEnv)) {
		envMap.set(key, JSON.stringify(value));
	}
	return envMap;
}

/**
 * Helper to register the onLoad handler
 */
function registerLoader(build: PluginBuilder, envMap: Map<string, string>) {
	build.onLoad({ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ }, async (args) => {
		// Skip node_modules and other non-source files
		if (args.path.includes("node_modules")) {
			return undefined;
		}

		try {
			// Read the file contents
			const file = Bun.file(args.path);
			const contents = await file.text();

			// Replace process.env.VARIABLE patterns with validated values
			let transformed = contents;

			// Pattern 1: process.env.VARIABLE
			// Pattern 2: process.env["VARIABLE"]
			// Pattern 3: process.env['VARIABLE']
			for (const [key, value] of envMap.entries()) {
				// Replace process.env.KEY (word boundary to avoid partial matches)
				const dotPattern = new RegExp(
					`process\\.env\\.${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
					"g",
				);
				transformed = transformed.replace(dotPattern, value);

				// Replace process.env["KEY"] and process.env['KEY']
				const bracketPattern = new RegExp(
					`process\\.env\\[(["'])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1\\]`,
					"g",
				);
				transformed = transformed.replace(bracketPattern, value);
			}

			// Determine loader based on file extension
			const loader = (
				args.path.endsWith(".tsx") || args.path.endsWith(".jsx")
					? "tsx"
					: args.path.endsWith(".ts") || args.path.endsWith(".mts")
						? "ts"
						: "js"
			) as Loader;

			return {
				loader,
				contents: transformed,
			};
		} catch {
			// If file can't be read, return undefined to let Bun handle it
			return undefined;
		}
	});
}

/**
 * Bun plugin to validate environment variables using ArkEnv and expose prefixed variables to client code.
 *
 * You can use this in one of two ways:
 *
 * 1. **Zero-config (Static Analysis)**:
 *    Automatically looks for `./src/env.ts` or `./env.ts`.
 *
 *    In `bunfig.toml`:
 *    ```toml
 *    [serve.static]
 *    plugins = ["@arkenv/bun-plugin"]
 *    ```
 *    and in `Bun.build`:
 *    ```ts
 *    import arkenv from "@arkenv/bun-plugin";
 *    Bun.build({
 *      plugins: [arkenv]
 *    })
 *    ```
 *
 * 2. **Manual Configuration**:
 *    Call it as a function in `Bun.build` with your schema.
 *    ```ts
 *    import arkenv from "@arkenv/bun-plugin";
 *    import { Env } from "./src/env";
 *    Bun.build({
 *      plugins: [arkenv(Env)]
 *    })
 *    ```
 */
export function arkenv(options: EnvSchemaWithType): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | EnvSchemaWithType,
): BunPlugin {
	const envMap = processEnvSchema<T>(options);

	return {
		name: "@arkenv/bun-plugin",
		setup(build) {
			registerLoader(build, envMap);
		},
	} satisfies BunPlugin;
}

// Attach static analysis properties to the function to make it a valid BunPlugin object
// This allows it to be used in bunfig.toml as `plugins = ["@arkenv/bun-plugin"]`
/**
 * Bun plugin to validate environment variables using ArkEnv and expose prefixed variables to client code.
 *
 * You can use this in one of two ways:
 *
 * 1. **Zero-config (Static Analysis)**:
 *    Automatically looks for `./src/env.ts` or `./env.ts`.
 *
 *    In `bunfig.toml`:
 *    ```toml
 *    [serve.static]
 *    plugins = ["@arkenv/bun-plugin"]
 *    ```
 *    and in `Bun.build`:
 *    ```ts
 *    import arkenv from "@arkenv/bun-plugin";
 *    Bun.build({
 *      plugins: [arkenv]
 *    })
 *    ```
 *
 * 2. **Manual Configuration**:
 *    Call it as a function in `Bun.build` with your schema.
 *    ```ts
 *    import arkenv from "@arkenv/bun-plugin";
 *    import { Env } from "./src/env";
 *    Bun.build({
 *      plugins: [arkenv(Env)]
 *    })
 *    ```
 */
const hybrid = arkenv as typeof arkenv & BunPlugin;

Object.defineProperty(hybrid, "name", {
	value: "@arkenv/bun-plugin",
	writable: false,
});

hybrid.setup = (build) => {
	const envMap = new Map<string, string>();

	build.onStart(async () => {
		const cwd = process.cwd();
		let schema: any;

		const possiblePaths = [join(cwd, "src", "env.ts"), join(cwd, "env.ts")];

		for (const p of possiblePaths) {
			if (await Bun.file(p).exists()) {
				try {
					// Invalidate cache to support hot reloading of the schema file itself
					// Note: Bun's require cache invalidation might be needed if using require
					// For ESM import(), we might need a cache busting query param or similar if Bun caches it aggressively
					// However, for now, we'll try standard import.
					// To truly support hot reload of config, we might need to rely on Bun's watcher restarting the process
					// when bunfig.toml or dependencies change.
					const mod = await import(p);
					if (mod.default) {
						schema = mod.default;
						break;
					}
					if (mod.env) {
						schema = mod.env;
						break;
					}
				} catch (e) {
					console.error(`Failed to load env schema from ${p}:`, e);
				}
			}
		}

		if (!schema) {
			const pathsList = possiblePaths.map((p) => ` - ${p}`).join("\n");
			const example = `
Example \`src/env.ts\`:
\`\`\`ts
export default {
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean"
};
\`\`\`
`;
			throw new Error(
				`@arkenv/bun-plugin: No environment schema found.\n\nChecked paths:\n${pathsList}\n\nPlease create a schema file at one of these locations exporting your environment definition.\n${example}`,
			);
		}

		// Update the shared envMap with new values
		const newEnvMap = processEnvSchema(schema);
		envMap.clear();
		for (const [k, v] of newEnvMap) {
			envMap.set(k, v);
		}
	});

	registerLoader(build, envMap);
};

export default hybrid;
