import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-client-env.ts`.
import { env as importedClientEnv } from "#arkenv/client-env";
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
 * Create a validated, type-safe environment configuration for Nuxt applications (Server entry point).
 *
 * In Nuxt strict layout, omitting `extends` auto-merges the client env from
 * `#arkenv/client-env`. Pass `extends` explicitly to override that behavior.
 *
 * @param schemaOrOptions The schema definition or configuration options containing server/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if a client-side variable is missing from `runtimeEnv`
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options: {
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
		withAutoExtend(optionsOrIsServer),
		{ isServer: true, strictLayout: "server" },
		coreArkenv,
		getSchemaKeys,
	);
}

export { type } from "@arkenv/core";

export default arkenv;
