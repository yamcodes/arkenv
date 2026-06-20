import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema, Infer } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";
import type { MergeExtends } from "./types";

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client-side / SSR entry point).
 */
export function createEnv<
	const TSchema extends SchemaShape & { runtimeEnv?: never } = {},
	const TShared extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: EnvSchema<TSchema>,
	options?: {
		shared?: readonly TShared[];
		extends?: [...TExtends];
		runtimeEnv?: Record<string, unknown>;
	},
): Readonly<
	Pick<
		distill.Out<at.infer<TSchema, $>>,
		Extract<
			keyof distill.Out<at.infer<TSchema, $>>,
			(keyof TSchema & `NEXT_PUBLIC_${string}`) | TShared | (keyof TSchema & "NODE_ENV")
		>
	> &
		MergeExtends<TExtends>
>;

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
		return createEnvInternal(schemaOrOptions, false);
	}

	return createEnvInternal(schemaOrOptions, optionsOrIsServer, {
		isServer: false,
	});
}

export type { Infer } from "arkenv";
export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
