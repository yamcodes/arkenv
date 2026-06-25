import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Shared entry point).
 *
 * @param schema The schema definition containing the shared variables
 * @param options Optional configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 */
export function createEnv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>> {
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

export { type } from "@arkenv/core";

const arkenv = createEnv;
export default arkenv;
