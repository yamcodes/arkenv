import type { StandardSchemaV1 } from "@repo/types";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-client-env.ts`.
import { env as importedClientEnv } from "#arkenv/client-env";
import { ensureBootGate } from "#arkenv/server-boot";
import { resolveStrictClientEnv } from "@/strict-client-env";
import { dispatchStrictThinArkenv } from "@/thin-accessor";
import type { MergeExtends } from "@/types";

/**
 * Client env type auto-merged in Nuxt strict layout when `extends` is omitted.
 *
 * Resolved via the `#arkenv/client-env` virtual module alias registered by
 * `@arkenv/nuxt/module`.
 */
type AutoClientEnv = typeof import("#arkenv/client-env") extends {
	env: infer E;
}
	? E
	: {};

/**
 * Create a validated, typesafe environment configuration for Nuxt applications (Server entry point, Standard Mode).
 *
 * With `@arkenv/nuxt/module` in strict layout, omitting `extends` includes the
 * client and shared env by default. Any explicit `extends` is used as-is and
 * opts out of that default; pass `extends: []` to include no extended env.
 *
 * @example Default strict-layout behavior
 * ```ts
 * import arkenv from "@arkenv/nuxt/standard/server";
 *
 * export const env = arkenv({
 *   DATABASE_URL: databaseUrlSchema,
 * });
 * ```
 *
 * @example Opt out of the default client merge
 * ```ts
 * export const env = arkenv(
 *   { DATABASE_URL: databaseUrlSchema },
 *   { extends: [] },
 * );
 * ```
 *
 * @param schemaOrOptions The schema definition or configuration options containing server/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if a client-side variable is missing from `runtimeEnv`
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
}): Readonly<
	{
		[K in keyof (TServer & TShared)]: StandardSchemaV1.InferOutput<
			(TServer & TShared)[K]
		>;
	} & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	return dispatchStrictThinArkenv(schemaOrOptions, optionsOrIsServer, {
		strictLayout: "server",
		resolveAutoExtendTarget: () => resolveStrictClientEnv(importedClientEnv),
		ensureBootGate,
	});
}

export default arkenv;
