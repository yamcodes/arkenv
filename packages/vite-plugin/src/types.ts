import type { FilterByPrefix, InferType } from "@repo/types";
import type { type } from "arktype";

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
 * @see {@link https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env | Documentation: Typing import.meta.env}
 * @see {@link https://github.com/Julien-R44/vite-plugin-validate-env#typing-importmetaenv | Original implementation by Julien-R44}
 */
export type ImportMetaEnvAugmented<
	TSchema extends type.Any,
	Prefix extends string = "VITE_",
> = FilterByPrefix<InferType<TSchema>, Prefix>;
