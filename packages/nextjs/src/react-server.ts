import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server-side RSC entry point).
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NEXT_PUBLIC_`
 * @throws An error if any client or shared variable is missing from `runtimeEnv`
 */
export function createEnv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: TShared;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<distill.Out<at.infer<TServer & TClient & TShared, $>>> {
	type ReturnType = Readonly<
		distill.Out<at.infer<TServer & TClient & TShared, $>>
	>;
	return createEnvInternal(options, true) as ReturnType;
}

export { type } from "arkenv";

/**
 * ArkEnv's Next.js integration export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
