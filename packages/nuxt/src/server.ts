import type { EnvSchema } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-client-env.ts`.
import { env as importedClientEnv } from "#arkenv/client-env";
import { ensureBootGate } from "#arkenv/server-boot";
import { arkenvInternal, type FlatSchemaOptions } from "./arkenv-internal";
import {
	isStrictLayoutActive,
	resolveStrictClientEnv,
} from "./strict-client-env";
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
 * Apply strict-layout auto-extend when `extends` is omitted.
 *
 * Kept in the server entry so client bundles never import this module graph.
 *
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @returns Options with auto-extend applied when appropriate
 */
function withAutoExtend(
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
): FlatSchemaOptions | boolean | null | undefined {
	if (typeof optionsOrIsServer === "boolean") {
		return optionsOrIsServer;
	}

	if (optionsOrIsServer != null && "extends" in optionsOrIsServer) {
		return optionsOrIsServer;
	}

	if (!isStrictLayoutActive()) {
		return optionsOrIsServer;
	}

	return {
		...(optionsOrIsServer ?? {}),
		extends: [resolveStrictClientEnv(importedClientEnv)],
	};
}

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
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	const hooks = { ensureBootGate };

	if (isLegacy) {
		if ("client" in schemaOrOptions) {
			throw new Error(
				"server entry point only accepts 'server' and 'shared' schemas.",
			);
		}
		return arkenvInternal(schemaOrOptions, true, undefined, hooks);
	}

	return arkenvInternal(
		schemaOrOptions,
		withAutoExtend(optionsOrIsServer),
		{ isServer: true, strictLayout: "server" },
		hooks,
	);
}

export default arkenv;
