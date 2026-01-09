import type { FilterByPrefix, InferType } from "@repo/types";

/**
 * Augment the `import.meta.env` object with typesafe environment variables
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
 *
 * @see {@link https://github.com/Julien-R44/vite-plugin-validate-env#typing-importmetaenv | Original implementation by Julien-R44}
 */
// export type ImportMetaEnvAugmented<
// 	TSchema,
// 	Prefix extends string = "VITE_",
// > = FilterByPrefix<InferType<TSchema>, Prefix>;

export type ImportMetaEnvAugmented<
	TSchema,
	Prefix extends string = "VITE_",
> = InferType<TSchema>;
