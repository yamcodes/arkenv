import type { Logger, LogLevel } from "@repo/log";

/**
 * Configuration options for the ArkEnv Next.js integration.
 *
 * @example
 * ```ts
 * const configOptions: ArkEnvConfigOptions = {
 *   schemaPath: "./src/env.ts",
 *   outputPath: "./src/generated/env.gen.ts"
 * };
 * ```
 */
export type ArkEnvConfigOptions = {
	/**
	 * Specify the path to the schema definition file.
	 *
	 * Defaults to searching for `"src/env.ts"` or `"env.ts"` in the project root.
	 *
	 * @default "src/env.ts"
	 * @example
	 * ```ts
	 * export default withArkEnv(nextConfig, {
	 *   schemaPath: "./src/env.ts"
	 * });
	 * ```
	 */
	schemaPath?: string;

	/**
	 * Specify the path where the generated file (`env.gen.ts`) should be written.
	 *
	 * Defaults to `"generated/env.gen.ts"` in the same directory as the schema file.
	 *
	 * @default "[schemaDirectory]/generated/env.gen.ts"
	 * @example
	 * ```ts
	 * export default withArkEnv(nextConfig, {
	 *   outputPath: "./src/generated/env.gen.ts"
	 * });
	 * ```
	 */
	outputPath?: string;

	/**
	 * Specify the configuration layout.
	 *
	 * - `"flat"` (default): A single `env.ts` schema file.
	 * - `"strict"`: A 3-file split schema layout (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`).
	 *
	 * @default "flat"
	 */
	layout?:
		| "flat"
		| "strict"
		/** @deprecated Use `"flat"` instead. `"simple"` will be removed in the next major version. */
		| "simple";

	/**
	 * Force standard mode code generation.
	 *
	 * When `true`, the generated `env.gen.ts` imports from `@arkenv/nextjs/standard/*`
	 * instead of `@arkenv/nextjs/*`, ensuring the Standard Schema engine (`@arkenv/standard`)
	 * is used and `arktype` is never bundled. This is set automatically when importing from
	 * `@arkenv/nextjs/standard/config`, but can be toggled manually for custom setups.
	 *
	 * @default false
	 */
	standard?: boolean;

	/**
	 * Enable or disable build-time environment variable validation during build/dev startup.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Enable or disable automatic code generation of the `env.gen.ts` file.
	 *
	 * @default true
	 */
	codegen?: boolean;

	/**
	 * Custom logger instance for build-time messages.
	 *
	 * When omitted, ArkEnv uses a console logger respecting `ARKENV_LOG_LEVEL`.
	 */
	logger?: Logger;

	/**
	 * Minimum log level for build-time messages.
	 *
	 * Programmatic `logger` takes precedence over `logLevel`.
	 */
	logLevel?: LogLevel;
};
