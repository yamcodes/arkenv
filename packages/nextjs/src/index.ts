import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import { getSchemaKeys } from "@arkenv/core/issues";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import { assertNotRemovedNestedBag } from "./removed-nested";
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
 * Create a validated, typesafe environment configuration for Next.js applications (Client-side / SSR entry point).
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

export function arkenv(schema: any, options?: any): any {
	assertNotRemovedNestedBag(schema);

	return arkenvInternal(
		schema,
		options,
		{ isServer: false },
		coreArkenv,
		getSchemaKeys,
	);
}

export type { ArkEnvScriptProps } from "./script";
export { ArkEnvScript } from "./script";

export default arkenv;
