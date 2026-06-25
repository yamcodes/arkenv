import "server-only";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { Dict, StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server entry point, Standard Mode).
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
>(
	schema: TSchema,
	options?: {
		extends?: readonly unknown[];
		runtimeEnv?: Dict<string>;
	},
): Readonly<{ [K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]> }>;

export function arkenv<
	const TServer extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
>(options: {
	server?: TServer;
	shared?: TShared;
	extends?: readonly unknown[];
	runtimeEnv?: Record<keyof TShared, string | undefined> & Dict<string>;
}): Readonly<{
	[K in keyof (TServer & TShared)]: StandardSchemaV1.InferOutput<
		(TServer & TShared)[K]
	>;
}>;

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
		optionsOrIsServer,
		{ isServer: true },
		coreArkenv,
		getSchemaKeys,
	);
}

export default arkenv;
