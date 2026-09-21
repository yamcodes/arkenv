import type { EnvSchema, Infer } from "@arkenv/core";
import type { SchemaShape } from "@repo/types";
// Virtual: empty on client, real ensureBootGate on server (see module aliases).
import { ensureBootGate } from "#arkenv/server-boot";
import type { FlatSchemaOptions } from "./schema-shape";
import { dispatchFlatThinArkenv } from "./thin-accessor";

/**
 * Create a typesafe environment configuration for Nuxt.
 *
 * Reads already-coerced values from Nuxt `runtimeConfig` / `__NUXT__`.
 * This entry does not re-validate.
 *
 * @param schema Flat schema definition
 * @param options Optional extends / exposeToClient / runtimeEnv
 * @returns A readonly environment proxy
 */
export function arkenv<const TSchema extends SchemaShape = {}>(
	schema: EnvSchema<TSchema>,
	options?: FlatSchemaOptions,
): Readonly<Infer<TSchema>>;

export function arkenv(
	schema: SchemaShape | Record<string, unknown>,
	options?: FlatSchemaOptions,
): unknown {
	return dispatchFlatThinArkenv(schema, options, {
		ensureBootGate,
	});
}

export type { EnvSchema } from "@arkenv/core";

export default arkenv;
