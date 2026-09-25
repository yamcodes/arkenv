import { arkenv as coreArkenv } from "@arkenv/standard";
import { getSchemaKeys } from "@arkenv/standard/issues";
import type { StandardSchemaV1 } from "@repo/types";
import { assertNotNestedBag } from "@repo/utils/nested-bag-migration-error";
import { arkenvInternal } from "@/arkenv-internal";
import type { MergeExtends } from "../types";

/**
 * Create a validated, typesafe environment configuration for Next.js Server Components in Standard Mode.
 *
 * @param schema A flat schema of environment variable Standard Schema validators
 * @param options Optional configuration including client-side variables and extends
 * @returns A validated, readonly environment variables object for the full schema
 */
export function arkenv<
	const TSchema extends Record<string, StandardSchemaV1> = {},
	const TExpose extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options?: {
		exposeToClient?: readonly TExpose[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<
	{
		[K in keyof TSchema]: StandardSchemaV1.InferOutput<TSchema[K]>;
	} & MergeExtends<TExtends>
>;

export function arkenv(schema: any, options?: any): any {
	assertNotNestedBag(schema, options);

	return arkenvInternal(
		schema,
		options,
		{ isServer: true },
		coreArkenv,
		getSchemaKeys,
	);
}

export default arkenv;
