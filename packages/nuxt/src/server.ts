import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Server entry point).
 *
 * @param schemaOrOptions The schema definition or configuration options containing server/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if a client-side variable is missing from `runtimeEnv`
 */
export function createEnv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
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
		strictLayout: "server",
	});
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
