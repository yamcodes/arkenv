import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv } from "@arkenv/core";
import { getSchemaKeys } from "@arkenv/core/issues";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import { assertNotRemovedNestedBag } from "./removed-nested";
import type { MergeExtends } from "./types";

/**
 * Create a validated, typesafe environment configuration for Next.js applications (Server-side RSC entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TShared extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with `NEXT_PUBLIC_` and `NODE_ENV` are exposed automatically.
		 * Use this option to expose custom variables that do not have the `NEXT_PUBLIC_` prefix.
		 */
		exposeToClient?: readonly TShared[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function arkenv(schema: any, options?: any): any {
	assertNotRemovedNestedBag(schema);

	return arkenvInternal(
		schema,
		options,
		{ isServer: true },
		coreArkenv,
		getSchemaKeys,
	);
}

export type { ArkEnvScriptProps } from "./script";
export { ArkEnvScript } from "./script";

export default arkenv;
