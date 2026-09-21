import type { Dict, SchemaShape } from "@repo/types";
import { assertNotRemovedNestedBag } from "./removed-nested";

/** Symbol key for the raw extended env values object on an env proxy. */
export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
/** Symbol key for the set of declared schema keys on an env proxy. */
export const ENV_KEYS = Symbol.for("arkenv.keys");
/** Symbol key for server-only keys that must not be readable on the client. */
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

/**
 * Options for the flat (unified) schema form of `arkenv()`.
 */
export type FlatSchemaOptions = {
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
	exposeToClient?: readonly string[];
};

/**
 * Context flags describing the execution environment.
 */
export type SchemaLayoutContext = {
	isServer: boolean;
	isShared?: boolean;
};

/**
 * Result of parsing and partitioning a schema definition.
 */
export type ParsedSchemaShape = {
	server: SchemaShape;
	client: Record<string, unknown>;
	shared: SchemaShape;
	extendsList: readonly unknown[];
	runtimeEnv: Dict<string>;
	declaredKeys: string[];
	publicKeys: string[];
};

/**
 * Parse and partition a flat schema definition into server, client, and shared buckets.
 *
 * @param schemaOrOptions Flat schema definition
 * @param optionsOrIsServer Flat options
 * @param context Optional layout and environment context
 * @returns Structured partition of schema buckets and key collections
 * @throws An error when the removed nested bag API is detected
 */
export function parseSchemaShape(
	schemaOrOptions: SchemaShape | null | undefined,
	optionsOrIsServer?: FlatSchemaOptions | null | undefined,
	context?: SchemaLayoutContext,
): ParsedSchemaShape {
	assertNotRemovedNestedBag(schemaOrOptions);

	const flatSchema = (schemaOrOptions || {}) as SchemaShape;
	const options = (optionsOrIsServer || {}) as FlatSchemaOptions;
	const extendsList = options.extends || [];
	const runtimeEnv = (options.runtimeEnv || {}) as Dict<string>;

	let server: SchemaShape = {};
	let client: Record<string, unknown> = {};
	let shared: SchemaShape = {};

	if (context?.isShared) {
		shared = flatSchema;
	} else {
		const exposedKeys = options.exposeToClient || [];
		for (const key of Object.keys(flatSchema)) {
			if (exposedKeys.includes(key) || key === "NODE_ENV") {
				shared[key] = flatSchema[key];
			} else if (key.startsWith("NUXT_PUBLIC_")) {
				client[key] = flatSchema[key];
			} else {
				server[key] = flatSchema[key];
			}
		}
	}

	const declaredKeys = Object.keys(flatSchema);
	const publicKeys = context?.isShared
		? Object.keys(flatSchema)
		: [...Object.keys(client), ...Object.keys(shared)];

	return {
		server,
		client,
		shared,
		extendsList,
		runtimeEnv,
		declaredKeys,
		publicKeys,
	};
}
