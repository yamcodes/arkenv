import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@repo/types";
import { arkenvInternal } from "@/arkenv-internal";
import { assertNotRemovedNestedBag } from "@/removed-nested";
import type { MergeExtends } from "../types";

type ClientVisibleKeys<
	TSchema extends Record<string, StandardSchemaV1>,
	TExpose extends keyof TSchema,
> = {
	[K in keyof TSchema]: K extends `NEXT_PUBLIC_${string}`
		? K
		: K extends "NODE_ENV"
			? K
			: K extends TExpose
				? K
				: never;
}[keyof TSchema];

/**
 * Create a validated, typesafe environment configuration for Next.js applications in Standard Mode.
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

export function arkenv(schema: any, options?: any): any {
	assertNotRemovedNestedBag(schema);

	return arkenvInternal(
		schema,
		options,
		{ isServer: false },
		coreArkenv,
		getSchemaKeys,
	);
}

export default arkenv;
