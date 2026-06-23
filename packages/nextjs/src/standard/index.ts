import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "../arkenv-internal";

/**
 * Create a validated, type-safe environment configuration for Next.js applications in Standard Mode.
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 */
export function arkenv<
	const TServer extends Record<string, StandardSchemaV1> = {},
	const TClient extends Record<string, StandardSchemaV1> = {},
	const TShared extends Record<string, StandardSchemaV1> = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: TShared;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
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
	return arkenvInternal(
		options,
		false,
		undefined,
		coreArkenv,
		getSchemaKeys,
	) as ReturnType;
}

export default arkenv;
