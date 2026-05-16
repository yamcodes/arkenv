import { join } from "node:path";
import type { CompiledEnvSchema, SchemaShape } from "@repo/types";
import type { ArkEnvConfig, EnvSchema } from "arkenv";
import type { BunPlugin } from "bun";
import { processEnvSchema, registerLoader } from "./utils";

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
 *
 * @param options - The environment variable schema definition.
 * @param arkenvConfig - Optional ArkEnv configuration (e.g. `coerce`, `onUndeclaredKey`).
 * @returns A Bun plugin that validates environment variables and exposes prefixed variables to client code.
 */
export function arkenv(
	options: CompiledEnvSchema,
	arkenvConfig?: ArkEnvConfig & { publicPrefix?: string },
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	arkenvConfig?: ArkEnvConfig & { publicPrefix?: string },
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	arkenvConfig?: ArkEnvConfig & { publicPrefix?: string },
): BunPlugin {
	const envMap = processEnvSchema<T>(options, arkenvConfig);

	return {
		name: "@arkenv/bun-plugin",
		setup(build) {
			registerLoader(build, envMap);
		},
	} satisfies BunPlugin;
}

/**
 * Hybrid object that acts both as a function and as a BunPlugin object.
 */
export const hybrid = arkenv as typeof arkenv & BunPlugin;

Object.defineProperty(hybrid, "name", {
	value: "@arkenv/bun-plugin",
	writable: false,
});

hybrid.setup = (build) => {
	const envMap = new Map<string, string>();
	let initialized = false;
	let initPromise: Promise<void> | null = null;

	const runDiscovery = async (currentPath?: string) => {
		if (initialized) return;

		// Skip discovery if we are currently loading one of the possible schema files
		// to avoid a deadlock during the `import()` call.
		const cwd = process.cwd();
		const possiblePaths = [join(cwd, "src", "env.ts"), join(cwd, "env.ts")];
		if (currentPath && possiblePaths.includes(currentPath)) {
			return;
		}

		if (initPromise) return initPromise;

		initPromise = (async () => {
			let schema: any;

			for (const p of possiblePaths) {
				if (await Bun.file(p).exists()) {
					try {
						const mod = await import(p);
						if (mod.default) {
							schema = mod.default;
							break;
						}
						if (mod.env) {
							schema = mod.env;
							break;
						}
						if (mod.Env) {
							schema = mod.Env;
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
import { type } from "arktype";

export default type({
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean"
});
\`\`\`
`;
				throw new Error(
					`@arkenv/bun-plugin: No environment schema found.\n\nChecked paths:\n${pathsList}\n\nPlease create a schema file at one of these locations exporting your environment definition.\n${example}`,
				);
			}

			// In Bun server/runtime environments, we want to act like Node and not filter by prefix.
			// We detect this if onStart is missing (runtime plugin) or if target is 'bun'/'node'.
			const target = (build as any).config?.target;
			const isServer = !build.onStart || target === "bun" || target === "node";
			const publicPrefix = isServer ? "" : "BUN_PUBLIC_";

			const newEnvMap = processEnvSchema(schema, { publicPrefix });
			envMap.clear();
			for (const [k, v] of newEnvMap) {
				envMap.set(k, v);
			}
			initialized = true;
		})();

		return initPromise;
	};

	build.onStart?.(async () => {
		initialized = false;
		initPromise = null;
		await runDiscovery();
	});

	registerLoader(build, envMap, (path) => runDiscovery(path));
};
