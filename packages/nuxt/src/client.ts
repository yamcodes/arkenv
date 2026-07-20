import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-shared-schema.ts`.
import { SharedSchema as importedSharedSchema } from "#arkenv/shared-schema";
import { arkenvInternal, type FlatSchemaOptions } from "./arkenv-internal";
import { isStrictLayoutActive } from "./strict-client-env";
import { resolveStrictSharedSchema } from "./strict-shared-schema";
import type { MergeExtends, ResolveExtendsElement } from "./types";

/**
 * Shared schema type auto-merged in Nuxt strict layout when `extends` is omitted.
 *
 * Resolved via the `#arkenv/shared-schema` virtual module alias registered by
 * `@arkenv/nuxt/module`.
 */
type AutoSharedSchema = typeof import("#arkenv/shared-schema") extends {
	SharedSchema: infer S;
}
	? ResolveExtendsElement<S>
	: {};

/**
 * Apply strict-layout auto-extend when `extends` is omitted.
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
		extends: [resolveStrictSharedSchema(importedSharedSchema)],
	};
}

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Client entry point).
 *
 * With `@arkenv/nuxt/module` in strict layout, omitting `extends` includes the
 * shared schema by default. Any explicit `extends` is used as-is and opts out
 * of that default; pass `extends: []` to include no extended env.
 *
 * @example Default strict-layout behavior
 * ```ts
 * import arkenv from "@arkenv/nuxt/client";
 *
 * export const env = arkenv({
 *   NUXT_PUBLIC_API_URL: "string",
 * });
 * ```
 *
 * @example Opt out of the default shared merge
 * ```ts
 * export const env = arkenv(
 *   { NUXT_PUBLIC_API_URL: "string" },
 *   { extends: [] },
 * );
 * ```
 *
 * @param schemaOrOptions The schema definition or configuration options containing client/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 * @throws An error if a server-only variable is accessed on the client side
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema> & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options: {
		/**
		 * Explicit envs/schemas to extend. Providing this option opts out of the
		 * default strict-layout shared merge; use `[]` to include no extended env.
		 */
		extends: [...TExtends];
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function arkenv<const TSchema extends SchemaShape = {}>(
	schema: EnvSchema<TSchema> & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: undefined;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & AutoSharedSchema>;

export function arkenv<
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
}): Readonly<
	distill.Out<at.infer<TClient & TShared, $>> & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("client" in schemaOrOptions || "shared" in schemaOrOptions);

	if (isLegacy) {
		if ("server" in schemaOrOptions) {
			throw new Error(
				"client entry point only accepts 'client' and 'shared' schemas.",
			);
		}
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
		withAutoExtend(optionsOrIsServer),
		{ isServer: false, strictLayout: "client" },
		coreArkenv,
		getSchemaKeys,
	);
}

export { type } from "@arkenv/core";

export default arkenv;
