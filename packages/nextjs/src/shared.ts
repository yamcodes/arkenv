import type { $ } from "@repo/scope";
import type { Dict, SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Shared entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
		runtimeEnv?: Dict<string>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>> {
	const isServer = typeof window === "undefined";
	return arkenvInternal(schema, options, {
		isServer,
		isShared: true,
	}) as any;
}

export { type } from "arkenv";

export default arkenv;
