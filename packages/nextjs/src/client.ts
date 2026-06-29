import type { EnvSchema } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { $ } from "@repo/scope";
import type { Dict, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema> & {
		[K in keyof TSchema]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	},
	options?: {
		extends?: [...TExtends];
		runtimeEnv: Record<keyof TSchema, string | undefined> & Dict<string>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

/**
 * @deprecated Use the unified flat layout signature instead: `arkenv(schema, options)`
 */
export function arkenv<
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<
	distill.Out<at.infer<TClient & TShared, $>> & MergeExtends<TExtends>
>;

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		if ("server" in schemaOrOptions) {
			throw new Error(
				"client entry point only accepts 'client' and 'shared' schemas.",
			);
		}
		return arkenvInternal(
			schemaOrOptions,
			false,
			undefined,
			coreArkenv,
			getSchemaKeys,
		);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer,
		{ isServer: false, strictLayout: "client" },
		coreArkenv,
		getSchemaKeys,
	);
}

export { type } from "@arkenv/core";

export default arkenv;
