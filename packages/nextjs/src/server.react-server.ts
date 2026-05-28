import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server React-Server entry point).
 */
export function createEnv<
	const TServer extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	server?: EnvSchema<TServer>;
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
	runtimeEnv: Record<keyof TShared, unknown> & Record<string, unknown>;
}): Readonly<
	distill.Out<at.infer<TServer & TShared, $>> & MergeExtends<TExtends>
> {
	if ("client" in options) {
		throw new Error(
			"server entry point only accepts 'server' and 'shared' schemas.",
		);
	}
	type ReturnType = Readonly<
		distill.Out<at.infer<TServer & TShared, $>> & MergeExtends<TExtends>
	>;
	return createEnvInternal(options as any, true) as ReturnType;
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
