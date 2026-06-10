import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import { createEnvInternal } from "./create-env";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications.
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 * @throws An error if any client or shared variable is missing from `runtimeEnv`
 */
export function createEnv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: EnvSchema<TServer>;
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<Infer<TServer & TClient & TShared>> {
	type ReturnType = Readonly<Infer<TServer & TClient & TShared>>;
	// In Nuxt, we want to know whether we are in client or server.
	// We can check if `typeof window === "undefined"` to dynamically detect server runtime.
	const isServer = typeof window === "undefined";
	return createEnvInternal(options, isServer) as ReturnType;
}

export type { Infer } from "arkenv";
export { type } from "arkenv";

/**
 * ArkEnv's Nuxt integration export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
