import type { Dict, SchemaShape } from "@repo/types";

/** Symbol key for the raw extended env values object on an env proxy. */
export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
/** Symbol key for the set of declared schema keys on an env proxy. */
export const ENV_KEYS = Symbol.for("arkenv.keys");
/** Symbol key for server-only keys that must not be readable on the client. */
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

/**
 * Legacy nested schema shape (`server` / `client` / `shared` buckets).
 */
export type LegacyNestedSchema = {
	server?: SchemaShape;
	client?: SchemaShape;
	shared?: SchemaShape;
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
};

/**
 * Options for the flat (unified) schema form of `arkenv()`.
 */
export type FlatSchemaOptions = {
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
	exposeToClient?: readonly string[];
	/** @deprecated Use `exposeToClient` instead. */
	expose?: readonly string[];
	/** @deprecated Use `exposeToClient` instead. */
	shared?: readonly string[];
};

/**
 * Context flags describing the execution environment and strict layout entrypoint.
 */
export type SchemaLayoutContext = {
	isServer: boolean;
	isShared?: boolean;
	strictLayout?: "client" | "server";
};

/**
 * Result of parsing and partitioning a schema definition.
 */
export type ParsedSchemaShape = {
	isLegacy: boolean;
	server: SchemaShape;
	client: Record<string, unknown>;
	shared: SchemaShape;
	extendsList: readonly unknown[];
	runtimeEnv: Dict<string>;
	declaredKeys: string[];
	publicKeys: string[];
};

/**
 * Determine whether a schema invocation uses the legacy nested bucket structure.
 *
 * @param schemaOrOptions The schema definition or nested options object
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @returns `true` if the invocation uses legacy nested options or a boolean isServer flag
 */
export function isLegacyNestedSchema(
	schemaOrOptions: unknown,
	optionsOrIsServer?: unknown,
): boolean {
	if (typeof optionsOrIsServer === "boolean") {
		return true;
	}
	return Boolean(
		schemaOrOptions &&
			typeof schemaOrOptions === "object" &&
			("runtimeEnv" in schemaOrOptions ||
				"server" in schemaOrOptions ||
				"client" in schemaOrOptions ||
				"shared" in schemaOrOptions),
	);
}

/**
 * Parse and partition a schema definition into server, client, and shared buckets.
 *
 * Provides a single, cycle-safe source of truth for nested-vs-flat decisions,
 * declared key collection, and public key extraction across schema capture and
 * thin accessors.
 *
 * @param schemaOrOptions Schema definition or legacy options object
 * @param optionsOrIsServer Flat options or legacy boolean flag
 * @param context Optional layout and environment context
 * @returns Structured partition of schema buckets and key collections
 */
export function parseSchemaShape(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer?: FlatSchemaOptions | boolean | null | undefined,
	context?: SchemaLayoutContext,
): ParsedSchemaShape {
	const isLegacy = isLegacyNestedSchema(schemaOrOptions, optionsOrIsServer);
	let server: SchemaShape = {};
	let client: Record<string, unknown> = {};
	let shared: SchemaShape = {};
	let extendsList: readonly unknown[] = [];
	let runtimeEnv: Dict<string> = {};

	if (isLegacy) {
		const legacy = (schemaOrOptions || {}) as LegacyNestedSchema;
		server = (legacy.server || {}) as SchemaShape;
		client = (legacy.client || {}) as Record<string, unknown>;
		shared = (legacy.shared || {}) as SchemaShape;
		extendsList = legacy.extends || [];
		runtimeEnv = (legacy.runtimeEnv || {}) as Dict<string>;
	} else {
		const flatSchema = (schemaOrOptions || {}) as SchemaShape;
		const options = (optionsOrIsServer || {}) as FlatSchemaOptions;
		extendsList = options.extends || [];
		runtimeEnv = (options.runtimeEnv || {}) as Dict<string>;

		if (context?.isShared) {
			shared = flatSchema;
		} else if (context?.strictLayout === "client") {
			client = flatSchema;
		} else if (context?.strictLayout === "server") {
			server = flatSchema;
		} else {
			const exposedKeys =
				options.exposeToClient || options.expose || options.shared || [];
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
	}

	const declaredKeys = isLegacy
		? [
				...Object.keys(server),
				...Object.keys(client),
				...Object.keys(shared),
			]
		: Object.keys((schemaOrOptions || {}) as SchemaShape);

	const publicKeys = isLegacy
		? [...Object.keys(client), ...Object.keys(shared)]
		: context?.strictLayout === "server"
			? []
			: context?.isShared || context?.strictLayout === "client"
				? Object.keys((schemaOrOptions || {}) as SchemaShape)
				: [...Object.keys(client), ...Object.keys(shared)];

	return {
		isLegacy,
		server,
		client,
		shared,
		extendsList,
		runtimeEnv,
		declaredKeys,
		publicKeys,
	};
}
