import type { type } from "arktype";

/**
 * Extract the inferred type from an ArkType type definition.
 * When a type definition is called, it returns either the validated value or type.errors.
 */
type InferType<T> = T extends (
	value: Record<string, string | undefined>,
) => infer R
	? R extends type.errors
		? never
		: R
	: T extends type.Any<infer U, infer _Scope>
		? U
		: never;

/**
 * Filter environment variables to only include those that start with the given prefix.
 * This ensures only client-exposed variables (e.g., VITE_*) are included in import.meta.env.
 */
type FilterByPrefix<
	T extends Record<string, unknown>,
	Prefix extends string = "VITE_",
> = {
	[K in keyof T as K extends `${Prefix}${string}` ? K : never]: T[K];
};

/**
 * Augment the `import.meta.env` object with type-safe environment variables
 * based on the schema validator.
 *
 * This type extracts the inferred type from the schema (result of `type()` from arkenv),
 * filters it to only include variables matching the Vite prefix (defaults to "VITE_"),
 * and makes them available on `import.meta.env`.
 *
 * @template TSchema - The environment variable schema (result of `type()` from arkenv)
 * @template Prefix - The prefix to filter by (defaults to "VITE_")
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import arkenv from '@arkenv/vite-plugin';
 * import { type } from 'arkenv';
 *
 * export const Env = type({
 *   VITE_API_URL: 'string',
 *   VITE_API_KEY: 'string',
 *   PORT: 'number.port', // Server-only, won't be in ImportMetaEnvAugmented
 * });
 *
 * export default defineConfig({
 *   plugins: [arkenv(Env)],
 * });
 * ```
 *
 * @example
 * ```ts
 * // src/vite-env.d.ts
 * /// <reference types="vite/client" />
 *
 * import type { ImportMetaEnvAugmented } from '@arkenv/vite-plugin';
 * import type { Env } from './env'; // or from vite.config.ts
 *
 * interface ImportMetaEnv extends ImportMetaEnvAugmented<typeof Env> {}
 * ```
 */
export type ImportMetaEnvAugmented<
	TSchema extends type.Any,
	Prefix extends string = "VITE_",
> = FilterByPrefix<InferType<TSchema>, Prefix>;
