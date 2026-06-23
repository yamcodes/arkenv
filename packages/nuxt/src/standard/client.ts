import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { Dict, StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "../arkenv-internal";
import type { MergeExtends } from "../types";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Client entry point, Standard Mode).
 *
 * @param schemaOrOptions The schema definition or configuration options containing client/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 * @throws An error if a server-only variable is accessed on the client side
 */
export function createEnv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: [...TExtends];
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & MergeExtends<TExtends>
>;

export function createEnv<
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

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
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
		optionsOrIsServer,
		{ isServer: false },
		coreArkenv,
		getSchemaKeys,
	);
}

const arkenv = createEnv;
export default arkenv;
