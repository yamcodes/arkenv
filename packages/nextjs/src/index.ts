import type { EnvSchema, Infer } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Extract keys from a schema type that are visible on the client:
 * - Keys prefixed with `NEXT_PUBLIC_`
 * - `NODE_ENV` (implicitly shared by Next.js)
 * - Keys listed in `exposeToClient`
 */
type ClientVisibleKeys<
	TSchema extends SchemaShape,
	TExpose extends keyof TSchema,
> = {
	[K in keyof TSchema]: K extends `NEXT_PUBLIC_${string}`
		? K
		: K extends "NODE_ENV"
			? K
			: K extends TExpose
				? K
				: never;
}[keyof TSchema];

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client-side / SSR entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TExpose extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with `NEXT_PUBLIC_` and `NODE_ENV` are exposed automatically.
		 * Use this option to expose custom variables that do not have the `NEXT_PUBLIC_` prefix.
		 */
		exposeToClient?: readonly TExpose[];
		/** @deprecated Use `exposeToClient` instead */
		expose?: readonly TExpose[];
		/** @deprecated Use `exposeToClient` instead */
		shared?: readonly TExpose[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<
	Pick<
		distill.Out<at.infer<TSchema, $>>,
		Extract<
			keyof distill.Out<at.infer<TSchema, $>>,
			ClientVisibleKeys<TSchema, TExpose>
		>
	> &
		MergeExtends<TExtends>
>;

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
			false,
			undefined,
			coreArkenv,
			getSchemaKeys,
		);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer,
		{ isServer: false },
		coreArkenv,
		getSchemaKeys,
	);
}

export const createEnv = arkenv;

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
