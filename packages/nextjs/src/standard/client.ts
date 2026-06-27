import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { Dict, StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client entry point, Standard Mode).
 *
 * @param schema A flat schema of `NEXT_PUBLIC_*` Standard Schema validators
 * @param options Optional extends and runtimeEnv overrides
 * @returns A validated, readonly environment variables object
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
>(
	schema: TSchema & {
		[K in keyof TSchema]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: readonly unknown[];
		runtimeEnv: Record<keyof TSchema, string | undefined> & Dict<string>;
	},
): Readonly<{ [K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]> }>;

/**
 * Create a validated, type-safe environment configuration for Next.js applications using
 * the split client/shared schema pattern (Client entry point, Standard Mode).
 *
 * @param options The environment validation configuration with client and shared schemas
 * @returns A validated, readonly environment variables object
 */
export function arkenv<
	const TClient extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
>(options: {
	client?: TClient & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: TShared;
	extends?: readonly unknown[];
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<{
	[K in keyof (TClient & TShared)]: StandardSchemaV1.InferOutput<
		(TClient & TShared)[K]
	>;
}>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

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

export default arkenv;
