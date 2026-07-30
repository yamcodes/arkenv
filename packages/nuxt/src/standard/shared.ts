import type { StandardSchemaV1 } from "@repo/types";
import { ensureBootGate } from "#arkenv/server-boot";
import { arkenvInternal } from "@/arkenv-internal";
import type { MergeExtends } from "@/types";

/**
 * Create a typesafe shared environment configuration for Nuxt (Standard Mode).
 *
 * @param schema The schema definition containing the shared variables
 * @param options Optional configuration options
 * @returns A readonly environment variables object wrapped in a security proxy
 */
export function arkenv<
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
> {
	const isServer = typeof window === "undefined";
	return arkenvInternal(
		schema,
		options,
		{
			isServer,
			isShared: true,
		},
		isServer ? { ensureBootGate } : undefined,
	) as any;
}

export default arkenv;
