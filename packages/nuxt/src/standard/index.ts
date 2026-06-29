import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";
import type { MergeExtends } from "../types";

type ClientVisibleKeys<
	TSchema extends Record<string, StandardSchemaV1>,
	TExpose extends keyof TSchema,
> = {
	[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}`
		? K
		: K extends "NODE_ENV"
			? K
			: K extends TExpose
				? K
				: never;
}[keyof TSchema];

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Standard Mode).
 *
 * @param schema A flat schema of environment variable Standard Schema validators
 * @param options Optional configuration including client-side variables and extends
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExpose extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options?: {
		exposeToClient?: readonly TExpose[];
		expose?: readonly TExpose[];
		shared?: readonly TExpose[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<
	Pick<
		{ [K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]> },
		Extract<keyof TSchema, ClientVisibleKeys<TSchema, TExpose>>
	> &
		MergeExtends<TExtends>
>;

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Standard Mode).
 *
 * @deprecated Use the unified flat layout signature instead: `arkenv(schema, options)`
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 */
export function arkenv<
	const TServer extends Record<string, StandardSchemaV1> = {},
	const TClient extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: TShared;
	runtimeEnv?: Record<string, unknown>;
}): Readonly<{
	[K in keyof (TServer & TClient & TShared)]: StandardSchemaV1.InferOutput<
		(TServer & TClient & TShared)[K]
	>;
}>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	const isServer = typeof window === "undefined";

	if (isLegacy) {
		return arkenvInternal(
			schemaOrOptions,
			isServer,
			undefined,
			coreArkenv,
			getSchemaKeys,
		);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer,
		{ isServer },
		coreArkenv,
		getSchemaKeys,
	);
}

export default arkenv;
