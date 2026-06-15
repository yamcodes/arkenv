import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Nuxt applications (Client entry point).
 *
 * @param schemaOrOptions The schema definition or configuration options containing client/shared schemas
 * @param optionsOrIsServer Optional configuration paths or a boolean indicating server status
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NUXT_PUBLIC_`
 * @throws An error if a server-only variable is accessed on the client side
 */
export function createEnv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema> & {
		[K in keyof TSchema]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: [...TExtends];
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function createEnv<
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
}): Readonly<
	distill.Out<at.infer<TClient & TShared, $>> & MergeExtends<TExtends>
>;

export function createEnv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("client" in schemaOrOptions || "shared" in schemaOrOptions);

	if (isLegacy) {
		if ("server" in schemaOrOptions) {
			throw new Error(
				"client entry point only accepts 'client' and 'shared' schemas.",
			);
		}
		return createEnvInternal(schemaOrOptions, false);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: false,
	});
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
