import "server-only";
import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { arkenvInternal } from "./arkenv-internal";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Server entry point).
 */
export function arkenv<
	const TSchema extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		extends?: [...TExtends];
		runtimeEnv?: Record<keyof TSchema | string, unknown>;
	},
): Readonly<distill.Out<at.infer<TSchema, $>> & MergeExtends<TExtends>>;

export function arkenv<
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

export function arkenv(schemaOrOptions: any, optionsOrIsServer?: any): any {
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
		return arkenvInternal(schemaOrOptions, true);
	}

	return arkenvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: true,
	});
}

export { type } from "arkenv";

export default arkenv;
