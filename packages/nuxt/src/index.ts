import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * @deprecated Use the unified flat layout signature instead: `createEnv(schema, options)`
 */
export function createEnv<
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
 * Create a validated, typesafe environment configuration for Nuxt applications.
 */
export function createEnv<
	const TSchema extends SchemaShape & {
		runtimeEnv?: never;
		server?: never;
		client?: never;
		shared?: never;
	} = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with `NUXT_PUBLIC_` and `NODE_ENV` are exposed automatically.
		 * Use this option to expose custom variables that do not have the `NUXT_PUBLIC_` prefix.
		 */
		exposeToClient?: readonly (keyof TSchema)[];
		/** @deprecated Use `exposeToClient` instead */
		expose?: readonly (keyof TSchema)[];
		/** @deprecated Use `exposeToClient` instead */
		shared?: readonly (keyof TSchema)[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	const isServer = typeof window === "undefined";

	if (isLegacy) {
		return createEnvInternal(schemaOrOptions, isServer);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer,
	});
}

export type { Infer } from "arkenv";
export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
