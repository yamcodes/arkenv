import type { EnvSchema, Infer } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server-side RSC entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TShared extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with `NEXT_PUBLIC_` and `NODE_ENV` are exposed automatically.
		 * Use this option to expose custom variables that do not have the `NEXT_PUBLIC_` prefix.
		 */
		exposeToClient?: readonly TShared[];
		/** @deprecated Use `exposeToClient` instead */
		expose?: readonly TShared[];
		/** @deprecated Use `exposeToClient` instead */
		shared?: readonly TShared[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

/**
 * @deprecated Use the unified flat layout signature instead: `createEnv(schema, options)`
 */
export function arkenv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: EnvSchema<TServer>;
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<Infer<TServer & TClient & TShared>>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		return arkenvInternal(
			schemaOrOptions,
			true,
			undefined,
			coreArkenv,
			getSchemaKeys,
		);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer,
		{ isServer: true },
		coreArkenv,
		getSchemaKeys,
	);
}

export type { Infer } from "@arkenv/core";
export { type } from "@arkenv/core";
export type { ArkEnvScriptProps } from "./script";
export { ArkEnvScript } from "./script";

/**
 * ArkEnv's Next.js integration export
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
