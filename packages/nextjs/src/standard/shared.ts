import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { Dict, StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Shared entry point, Standard Mode).
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
>(
	schema: TSchema,
	options?: {
		extends?: readonly unknown[];
		runtimeEnv?: Dict<string>;
	},
): Readonly<{
	[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
}> {
	const isServer = typeof window === "undefined";
	return arkenvInternal(
		schema,
		options,
		{
			isServer,
			isShared: true,
		},
		coreArkenv,
		getSchemaKeys,
	) as any;
}

export default arkenv;
