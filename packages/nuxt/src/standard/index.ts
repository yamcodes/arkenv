import type { StandardSchemaV1 } from "@repo/types";
import { ensureBootGate } from "#arkenv/server-boot";
import { dispatchFlatThinArkenv } from "@/thin-accessor";
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
 * Create a typesafe environment configuration for Nuxt (Standard Mode).
 *
 * Reads already-coerced values from Nuxt runtime config. This entry does not
 * re-validate.
 *
 * @param schema A flat schema of environment variable Standard Schema validators
 * @param options Optional configuration including client-side variables and extends
 * @returns A readonly environment variables object wrapped in a security proxy
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
	return dispatchFlatThinArkenv(schema, options, {
		ensureBootGate,
	});
}

export default arkenv;
