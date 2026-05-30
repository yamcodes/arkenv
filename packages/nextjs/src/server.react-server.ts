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
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
		runtimeEnv?: Record<keyof TSchema | string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function createEnv<
	const TServer extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	server?: EnvSchema<TServer>;
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
	runtimeEnv?: Record<keyof TShared, unknown> & Record<string, unknown>;
}): Readonly<
	distill.Out<at.infer<TServer & TShared, $>> & MergeExtends<TExtends>
>;

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		if ("client" in schemaOrOptions) {
			throw new Error(
				"server entry point only accepts 'server' and 'shared' schemas.",
			);
		}
		return createEnvInternal(schemaOrOptions, true);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: true,
	});
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
