import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Standard Mode).
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 */
export function createEnv<
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
}> {
	type ReturnType = Readonly<{
		[K in keyof (TServer & TClient & TShared)]: StandardSchemaV1.InferOutput<
			(TServer & TClient & TShared)[K]
		>;
	}>;
	// In Nuxt, we want to know whether we are in client or server.
	const isServer = typeof window === "undefined";
	return arkenvInternal(
		options,
		isServer,
		undefined,
		coreArkenv,
		getSchemaKeys,
	) as ReturnType;
}

const arkenv = createEnv;
export default arkenv;
