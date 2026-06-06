import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Shared entry point).
 */
export function createEnv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
		runtimeEnv?: Record<keyof TSchema | string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>> {
	const isServer = typeof window === "undefined";
	return createEnvInternal(schema, options, {
		isServer,
		isShared: true,
	}) as any;
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
