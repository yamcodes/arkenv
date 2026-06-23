import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "../arkenv-internal";
import type { MergeExtends } from "../types";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Server entry point, Standard Mode).
 *
 * @param schemaOrOptions The schema definition or configuration options containing server/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if a client-side variable is missing from `runtimeEnv`
 */
export function createEnv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options?: {
		extends?: [...TExtends];
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & MergeExtends<TExtends>
>;

export function createEnv<
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

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
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
		optionsOrIsServer,
		{ isServer: true },
		coreArkenv,
		getSchemaKeys,
	);
}

const arkenv = createEnv;
export default arkenv;
