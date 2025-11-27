import { join } from "node:path";
import type { EnvSchema } from "arkenv";
import { createEnv } from "arkenv";
import type { type } from "arktype";
import type { BunPlugin, Loader } from "bun";

export type { ProcessEnvAugmented } from "./types";

/**
 * Helper to create the onLoad handler
 */
function createOnLoadHandler(envMap: Map<string, string>) {
	return async (args: any) => {
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
		} catch (error) {
			// If file can't be read, return undefined to let Bun handle it
			return undefined;
		}
	};
}

/**
 * Helper to process env schema and return envMap
 */
function processEnvSchema(options: EnvSchema<any> | type.Any) {
	// Validate environment variables
	const env = createEnv(options, process.env);

	// Get Bun's prefix for client-exposed environment variables
	const prefix = "BUN_PUBLIC_";

	// Filter to only include environment variables matching the prefix
	const filteredEnv = Object.fromEntries(
		Object.entries(<Record<string, unknown>>env).filter(([key]) =>
			key.startsWith(prefix),
		),
	);

	// Create a map of variable names to their JSON-stringified values
	const envMap = new Map<string, string>();
	for (const [key, value] of Object.entries(filteredEnv)) {
		envMap.set(key, JSON.stringify(value));
	}
	return envMap;
}

/**
 * Bun plugin to validate environment variables using ArkEnv and expose them to client code.
 *
 * This is a hybrid export that can be used in two ways:
 *
 * 1. **Zero-config (Static Analysis)**:
 *    Add it directly to `bunfig.toml`. It will automatically look for `./src/env.ts` or `./env.ts`.
 *    ```toml
 *    [serve.static]
 *    plugins = ["@arkenv/bun-plugin"]
 *    ```
 *
 * 2. **Manual Configuration**:
 *    Call it as a function in `Bun.build` with your schema.
 *    ```ts
 *    import arkenv from "@arkenv/bun-plugin";
 *    Bun.build({
 *      plugins: [arkenv(MySchema)]
 *    })
 *    ```
 */
export function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T>,
): BunPlugin;
export function arkenv(options: type.Any): BunPlugin;
export function arkenv<const T extends Record<string, unknown>>(
	options: EnvSchema<T> | type.Any,
): BunPlugin {
	const envMap = processEnvSchema(options);

	return {
		name: "@arkenv/bun-plugin",
		setup(build) {
			build.onLoad(
				{ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ },
				createOnLoadHandler(envMap),
			);
		},
	} satisfies BunPlugin;
}

// Attach static analysis properties to the function to make it a valid BunPlugin object
// This allows it to be used in bunfig.toml as `plugins = ["@arkenv/bun-plugin"]`
const hybrid = arkenv as typeof arkenv & BunPlugin;

Object.defineProperty(hybrid, "name", {
	value: "@arkenv/bun-plugin",
	writable: false,
});

hybrid.setup = async (build) => {
	const cwd = process.cwd();
	let schema: any;

	const possiblePaths = [join(cwd, "src", "env.ts"), join(cwd, "env.ts")];

	for (const p of possiblePaths) {
		if (await Bun.file(p).exists()) {
			try {
				const mod = await import(p);
				if (mod.default) {
					schema = mod.default;
					break;
				}
			} catch (e) {
				console.error(`Failed to load env schema from ${p}:`, e);
			}
		}
	}

	if (!schema) {
		console.warn(
			"No env schema found in src/env.ts or env.ts. Skipping @arkenv/bun-plugin validation.",
		);
		return;
	}

	const envMap = processEnvSchema(schema);

	build.onLoad(
		{ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ },
		createOnLoadHandler(envMap),
	);
};

export default hybrid;
