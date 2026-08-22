import type { EnvSchema, Infer } from "@arkenv/core";
import type { SchemaShape } from "@repo/types";
// Virtual: empty on client, real ensureBootGate on server (see module aliases).
import { ensureBootGate } from "#arkenv/server-boot";
import type { FlatSchemaOptions } from "./schema-shape";
import { dispatchFlatThinArkenv } from "./thin-accessor";

/**
 * Create a typesafe environment configuration for Nuxt (nested schema).
 *
 * Reads already-coerced values from Nuxt `runtimeConfig` / `__NUXT__`.
 * This entry does not re-validate.
 *
 * @param options Nested server/client/shared schema options
 * @returns A readonly environment proxy
 */
export function arkenv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: EnvSchema<TServer>;
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	runtimeEnv?: Record<string, unknown>;
}): Readonly<Infer<TServer & TClient & TShared>>;

/**
 * Create a typesafe environment configuration for Nuxt (flat schema).
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
	schemaOrOptions: SchemaShape | Record<string, unknown>,
	optionsOrIsServer?: FlatSchemaOptions | boolean,
): unknown {
	return dispatchFlatThinArkenv(schemaOrOptions, optionsOrIsServer, {
		ensureBootGate,
	});
}

export type { EnvSchema, Infer } from "@arkenv/core";

export default arkenv;
