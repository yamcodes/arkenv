import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import { createEnvInternal } from "./create-env";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client-side / SSR entry point).
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NEXT_PUBLIC_`
 * @throws An error if any client or shared variable is missing from `runtimeEnv`
 * @deprecated Use the codegen workflow by wrapping your config with `withArkEnv` from `@arkenv/nextjs/config` and importing `createEnv` from `./env.gen.ts`.
 */
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
}): Readonly<Infer<TServer & TClient & TShared>> {
	type ReturnType = Readonly<Infer<TServer & TClient & TShared>>;
	return createEnvInternal(options, false) as ReturnType;
}

export type { Infer } from "arkenv";
export { type } from "arkenv";

/**
 * ArkEnv's Next.js integration export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 *
 * @deprecated Use the codegen workflow by wrapping your config with `withArkEnv` from `@arkenv/nextjs/config` and importing `createEnv` from `./env.gen.ts`.
 */
const arkenv = createEnv;
export default arkenv;
