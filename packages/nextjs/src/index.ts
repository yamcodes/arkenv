import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client-side / SSR entry point).
 */
export function createEnv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TExpose extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with `NEXT_PUBLIC_` and `NODE_ENV` are exposed automatically.
		 * Use this option to expose custom variables that do not have the `NEXT_PUBLIC_` prefix.
		 */
		exposeToClient?: readonly TExpose[];
		/** @deprecated Use `exposeToClient` instead */
		expose?: readonly TExpose[];
		/** @deprecated Use `exposeToClient` instead */
		shared?: readonly TExpose[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function createEnv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: EnvSchema<TServer>;
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<Infer<TServer & TClient & TShared>>;

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		return createEnvInternal(schemaOrOptions, false);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: false,
	});
}

export type { Infer } from "arkenv";
export { type } from "arkenv";
export type { ArkEnvScriptProps } from "./script";
export { ArkEnvScript } from "./script";

const arkenv = createEnv;
export default arkenv;
