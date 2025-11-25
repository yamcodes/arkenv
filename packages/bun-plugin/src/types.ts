import type { InferType } from "@repo/types";
import type { type } from "arktype";

/**
 * Filter environment variables to only include those that start with the given prefix.
 * This ensures only client-exposed variables (e.g., BUN_PUBLIC_*) are included in process.env.
 */
type FilterByPrefix<
	T extends Record<string, unknown>,
	Prefix extends string = "BUN_PUBLIC_",
> = {
	[K in keyof T as K extends `${Prefix}${string}` ? K : never]: T[K];
};

/**
 * Augment the `process.env` object with typesafe environment variables
 * based on the schema validator.
 *
 * This type extracts the inferred type from the schema (result of `type()` from arkenv),
 * filters it to only include variables matching the Bun prefix (defaults to "BUN_PUBLIC_"),
 * and makes them available on `process.env`.
 *
 * @template TSchema - The environment variable schema (result of `type()` from arkenv)
 * @template Prefix - The prefix to filter by (defaults to "BUN_PUBLIC_")
 *
 * @example
 * ```ts
 * // bun.config.ts or similar
 * import arkenv from '@arkenv/bun-plugin';
 * import { type } from 'arkenv';
 *
 * export const Env = type({
 *   BUN_PUBLIC_API_URL: 'string',
 *   BUN_PUBLIC_DEBUG: 'boolean',
 *   PORT: 'number.port', // Server-only, won't be in ProcessEnvAugmented
 * });
 *
 * export default {
 *   plugins: [arkenv(Env)],
 * };
 * ```
 *
 * @example
 * ```ts
 * // src/env.d.ts
 * /// <reference types="bun-types" />
 *
 * import type { ProcessEnvAugmented } from '@arkenv/bun-plugin';
 * import type { Env } from './env'; // or from bun.config.ts
 *
 * declare global {
 *   namespace NodeJS {
 *     interface ProcessEnv extends ProcessEnvAugmented<typeof Env> {}
 *   }
 * }
 * ```
 */
export type ProcessEnvAugmented<
	TSchema extends type.Any,
	Prefix extends string = "BUN_PUBLIC_",
> = FilterByPrefix<InferType<TSchema>, Prefix>;
