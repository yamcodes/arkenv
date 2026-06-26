import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server-side RSC entry point).
 */
export function createEnv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TShared extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		exposeToClient?: readonly TShared[];
		/** @deprecated Use `exposeToClient` instead */
		expose?: readonly TShared[];
		/** @deprecated Use `exposeToClient` instead */
		shared?: readonly TShared[];
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
		return createEnvInternal(schemaOrOptions, true);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: true,
	});
}

export type { Infer } from "arkenv";
export { type } from "arkenv";
export type { ArkEnvScriptProps } from "./script";
export { ArkEnvScript } from "./script";

const arkenv = createEnv;
export default arkenv;
