import type { StandardSchemaV1 } from "@repo/types";
// Static import so Vite/Nitro can resolve the alias at bundle time.
// Outside strict layout the module aliases this to `empty-shared-schema.ts`.
import { SharedSchema as importedSharedSchema } from "#arkenv/shared-schema";
import { resolveStrictSharedSchema } from "@/strict-shared-schema";
import { dispatchStrictThinArkenv } from "@/thin-accessor";
import type { MergeExtends, ResolveExtendsElement } from "@/types";

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
 * Create a typesafe environment configuration for Nuxt (client entry, Standard Mode).
 *
 * Reads the already-coerced public payload — does not import or run the validator.
 *
 * With `@arkenv/nuxt/module` in strict layout, omitting `extends` includes the
 * shared schema by default. Any explicit `extends` is used as-is and opts out
 * of that default; pass `extends: []` to include no extended env.
 *
 * @param schemaOrOptions The schema definition or configuration options containing client/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 * @throws An error if a server-only variable is accessed on the client side
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options: {
		/**
		 * Explicit envs/schemas to extend. Providing this option opts out of the
		 * default strict-layout shared merge; use `[]` to include no extended env.
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
	schema: TSchema & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: undefined;
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & AutoSharedSchema
>;

export function arkenv<
	const TClient extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	client?: TClient & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: TShared;
	extends?: [...TExtends];
}): Readonly<
	{
		[K in keyof (TClient & TShared)]: StandardSchemaV1.InferOutput<
			(TClient & TShared)[K]
		>;
	} & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	return dispatchStrictThinArkenv(schemaOrOptions, optionsOrIsServer, {
		strictLayout: "client",
		resolveAutoExtendTarget: () =>
			resolveStrictSharedSchema(importedSharedSchema),
	});
}

export default arkenv;
