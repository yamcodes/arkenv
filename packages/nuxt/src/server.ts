import type { EnvSchema } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-client-env.ts`.
import { env as importedClientEnv } from "#arkenv/client-env";
import { ensureBootGate } from "#arkenv/server-boot";
import { resolveStrictClientEnv } from "./strict-client-env";
import { dispatchStrictThinArkenv } from "./thin-accessor";
import type { MergeExtends } from "./types";

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
 * Create a typesafe environment configuration for Nuxt (server entry).
 *
 * Calls {@link ensureBootGate} then reads coerced `runtimeConfig` values —
 * does not re-validate with core in this entry.
 *
 * With `@arkenv/nuxt/module` in strict layout, omitting `extends` includes the
 * client and shared env by default. Any explicit `extends` is used as-is and
 * opts out of that default; pass `extends: []` to include no extended env.
 *
 * @param schemaOrOptions The schema definition or configuration options containing server/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A readonly environment variables object wrapped in a security proxy
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
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function arkenv<const TSchema extends SchemaShape = {}>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: undefined;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & AutoClientEnv>;

export function arkenv<
	const TServer extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	server?: EnvSchema<TServer>;
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
}): Readonly<
	distill.Out<at.infer<TServer & TShared, $>> & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	return dispatchStrictThinArkenv(schemaOrOptions, optionsOrIsServer, {
		strictLayout: "server",
		resolveAutoExtendTarget: () => resolveStrictClientEnv(importedClientEnv),
		ensureBootGate,
	});
}

export default arkenv;
