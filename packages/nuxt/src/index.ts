import type { EnvSchema, Infer } from "@arkenv/core";
import { arkenv as coreArkenv, getSchemaKeys } from "@arkenv/core";
import type { SchemaShape } from "@repo/types";
import { arkenvInternal, type FlatSchemaOptions } from "./arkenv-internal";

export function arkenv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: EnvSchema<TServer>;
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NUXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	runtimeEnv?: Record<string, unknown>;
}): Readonly<Infer<TServer & TClient & TShared>>;

export function arkenv<const TSchema extends SchemaShape = {}>(
	schema: EnvSchema<TSchema>,
	options?: FlatSchemaOptions,
): Readonly<Infer<TSchema>>;

export function arkenv(
	schemaOrOptions: SchemaShape | Record<string, unknown>,
	optionsOrIsServer?: FlatSchemaOptions | boolean,
): unknown {
	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	const isServer = typeof window === "undefined";

	if (isLegacy) {
		return arkenvInternal(
			schemaOrOptions,
			isServer,
			undefined,
			coreArkenv,
			getSchemaKeys,
		);
	}

	return arkenvInternal(
		schemaOrOptions,
		optionsOrIsServer as FlatSchemaOptions | undefined,
		{ isServer },
		coreArkenv,
		getSchemaKeys,
	);
}

export type { Infer } from "@arkenv/core";
export { type } from "@arkenv/core";

export default arkenv;
