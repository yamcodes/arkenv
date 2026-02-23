import type { FilterByPrefix, InferType } from "@repo/types";
import type { type } from "arktype";

/**
 * Augment the `process.env` object with typesafe environment variables
 * based on the schema validator.
 *
 * This type extracts the inferred type from the schema (result of `type()` from arkenv),
 * filters by the Bun prefix (defaults to "BUN_PUBLIC_") and always includes `NODE_ENV`,
 * and makes them available on `process.env`.
 *
 * @template TSchema - The environment variable schema (result of `type()` from arkenv)
 * @template Prefix - The prefix to filter by (defaults to "BUN_PUBLIC_")
 * @template AllowedKeys - Additional keys to include regardless of prefix (defaults to "NODE_ENV")
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
 *   NODE_ENV: "'development' | 'production' | 'test'", // Included via AllowedKeys
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
 *     // process.env.BUN_PUBLIC_* and NODE_ENV are now typesafe
 *     interface ProcessEnv extends ProcessEnvAugmented<typeof Env> {}
 *   }
 * }
 * ```
 */
export type ProcessEnvAugmented<
	TSchema extends type.Any,
	Prefix extends string = "BUN_PUBLIC_",
	AllowedKeys extends string = "NODE_ENV",
> = FilterByPrefix<InferType<TSchema>, Prefix, AllowedKeys>;
