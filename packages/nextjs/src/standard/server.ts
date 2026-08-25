import "server-only";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { Dict, StandardSchemaV1 } from "@repo/types";
// Static import so webpack/Turbopack can resolve the alias at bundle time.
// Outside strict layout the package `imports` map points this at empty-client-env.
import { env as importedClientEnv } from "#arkenv/client-env";
import { arkenvInternal } from "@/arkenv-internal";
import { withAutoExtend } from "@/auto-extend";
import { resolveStrictClientEnv } from "@/strict-client-env";
import type { MergeExtends } from "@/types";

/**
 * Client env type auto-merged in Next.js strict layout when `extends` is omitted.
 */
type AutoClientEnv = typeof import("#arkenv/client-env") extends {
	env: infer E;
}
	? E
	: {};

/**
 * Create a validated, typesafe environment configuration for Next.js applications (Server entry point, Standard Mode).
 *
 * With `withArkEnv` in strict layout, omitting `extends` includes the client
 * env by default. Any explicit `extends` is used as-is and opts out of that
 * default; pass `extends: []` to include no extended env.
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options: {
		/**
		 * Explicit envs to extend. Providing this option opts out of the default
		 * strict-layout client merge; use `[]` to include no extended env.
		 */
		extends: [...TExtends];
		runtimeEnv?: Dict<string>;
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & MergeExtends<TExtends>
>;

export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
>(
	schema: TSchema,
	options?: {
		extends?: undefined;
		runtimeEnv?: Dict<string>;
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & AutoClientEnv
>;

export function arkenv<
	const TServer extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	server?: TServer;
	shared?: TShared;
	extends?: [...TExtends];
	runtimeEnv?: Record<keyof TShared, string | undefined> & Dict<string>;
}): Readonly<
	{
		[K in keyof (TServer & TShared)]: StandardSchemaV1.InferOutput<
			(TServer & TShared)[K]
		>;
	} & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		if ("client" in schemaOrOptions) {
			throw new Error(
				"server entry point only accepts 'server' and 'shared' schemas.",
			);
		}
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
		withAutoExtend(optionsOrIsServer, () =>
			resolveStrictClientEnv(importedClientEnv),
		),
		{ isServer: true, strictLayout: "server" },
		coreArkenv,
		getSchemaKeys,
	);
}

export default arkenv;
