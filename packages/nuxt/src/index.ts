import type { EnvSchema, Infer } from "@arkenv/core";
import type { SchemaShape } from "@repo/types";
// Virtual: empty on client, real ensureBootGate on server (see module aliases).
import { ensureBootGate } from "#arkenv/server-boot";
import { arkenvInternal, type FlatSchemaOptions } from "./arkenv-internal";

/**
 * Create a typesafe environment configuration for Nuxt (flat / unified entry).
 *
 * Values are read from the Nitro boot-gate coerced `runtimeConfig` / `__NUXT__`
 * payload — this entry does not run core validation.
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
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	const isServer = typeof window === "undefined";

	const hooks = isServer ? { ensureBootGate } : undefined;

	if (isLegacy) {
		return arkenvInternal(schemaOrOptions, isServer, undefined, hooks);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer as FlatSchemaOptions | undefined,
		{ isServer },
		hooks,
	);
}

export type { EnvSchema, Infer } from "@arkenv/core";

export default arkenv;
