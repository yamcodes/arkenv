import "server-only";
import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { Dict, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
// Static import so webpack/Turbopack can resolve the alias at bundle time.
// Outside strict layout the package `imports` map points this at empty-client-env.
import { env as importedClientEnv } from "#arkenv/client-env";
import { arkenvInternal } from "./arkenv-internal";
import { withAutoExtend } from "./auto-extend";
import { resolveStrictClientEnv } from "./strict-client-env";
import type { MergeExtends } from "./types";

/**
 * Client env type auto-merged in Next.js strict layout when `extends` is omitted.
 */
type AutoClientEnv = typeof import("#arkenv/client-env") extends {
	env: infer E;
}
	? E
	: {};

/**
 * Create a validated, typesafe environment configuration for Next.js applications (Server entry point).
 *
 * With `withArkEnv` in strict layout, omitting `extends` includes the client
 * env by default. Any explicit `extends` is used as-is and opts out of that
 * default; pass `extends: []` to include no extended env.
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options: {
		/**
		 * Explicit envs to extend. Providing this option opts out of the default
		 * strict-layout client merge; use `[]` to include no extended env.
		 */
		extends: [...TExtends];
		runtimeEnv?: Dict<string>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function arkenv<const TSchema extends SchemaShape = {}>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: undefined;
		runtimeEnv?: Dict<string>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & AutoClientEnv>;

/**
 * @deprecated Use the unified flat layout signature instead: `arkenv(schema, options)`
 */
export function arkenv<
	const TServer extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	server?: EnvSchema<TServer>;
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
	runtimeEnv?: Record<keyof TShared, string | undefined> & Dict<string>;
}): Readonly<
	distill.Out<at.infer<TServer & TShared, $>> & MergeExtends<TExtends>
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
