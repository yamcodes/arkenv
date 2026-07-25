import {
	formatMissingSchemaError,
	getDefaultSchemaFileCandidates,
} from "@arkenv/build";
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
	arkenvConfig?: ArkEnvConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
	arkenvConfig?: ArkEnvConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | CompiledEnvSchema,
	arkenvConfig?: ArkEnvConfig,
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

	build.onStart(async () => {
		const cwd = process.cwd();
		let schema: any;

		const possiblePaths = getDefaultSchemaFileCandidates(cwd);

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
				} catch (e) {
					console.error(`Failed to load env schema from ${p}:`, e);
				}
			}
		}

		if (!schema) {
			throw new Error(
				formatMissingSchemaError({
					prefix: "@arkenv/bun-plugin:",
					optionsHint: "plugin options",
					checkedPaths: possiblePaths,
				}),
			);
		}

		const newEnvMap = processEnvSchema(schema);
		envMap.clear();
		for (const [k, v] of newEnvMap) {
			envMap.set(k, v);
		}
	});

	registerLoader(build, envMap);
};
