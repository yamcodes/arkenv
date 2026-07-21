import type { Dict, SchemaShape } from "@repo/types";
import { isForceServer } from "./validate-context";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

export type LegacyNestedSchema = {
	server?: SchemaShape;
	client?: SchemaShape;
	shared?: SchemaShape;
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
};

export type FlatSchemaOptions = {
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
	/** @deprecated Use `exposeToClient` instead. */
	expose?: readonly string[];
	/** @deprecated Use `exposeToClient` instead. */
	shared?: readonly string[];
	exposeToClient?: readonly string[];
};

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @param schemaOrOptions The schema definition or the unified options object
 * @param optionsOrIsServer The options object or a boolean indicating if running on the server
 * @param context The optional execution context containing server and entrypoint flags
 * @param coreArkenv The arkenv function to use for validation
 * @param getSchemaKeys The getSchemaKeys function to extract schema keys
 * @returns The wrapped and validated environment proxy object
 * @throws An error if a required key is missing or invalid
 * @internal
 */
export function arkenvInternal(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	context:
		| {
				isServer: boolean;
				isShared?: boolean;
				strictLayout?: "client" | "server";
		  }
		| undefined,
	/** The core arkenv validation function (either `@arkenv/core` or `@arkenv/standard`). */
	coreArkenv: (schema: any, config?: any) => Record<string, unknown>,
	/** Extracts the declared key names from a schema object. */
	getSchemaKeys: (schema: SchemaShape) => string[],
): unknown {
	let server: SchemaShape = {};
	let client: Record<string, unknown> = {};
	let shared: SchemaShape = {};
	let extendsList: readonly unknown[] = [];
	let runtimeEnv: Dict<string> = {};
	let isServer = false;

	const globalConfig =
		typeof window !== "undefined"
			? (window as any).__NUXT__?.config?.public
			: undefined;

	if (typeof optionsOrIsServer === "boolean") {
		// Old nested schema behavior (backward compatible)
		const legacySchema = schemaOrOptions as
			| LegacyNestedSchema
			| null
			| undefined;
		server = (legacySchema?.server || {}) as SchemaShape;
		client = (legacySchema?.client || {}) as Record<string, unknown>;
		shared = (legacySchema?.shared || {}) as SchemaShape;
		extendsList = legacySchema?.extends || [];
		runtimeEnv = (legacySchema?.runtimeEnv || {}) as Dict<string>;
		isServer = optionsOrIsServer;
	} else {
		// New flat schema behavior
		const flatSchema = (schemaOrOptions || {}) as SchemaShape;
		const options = (optionsOrIsServer || {}) as FlatSchemaOptions;
		extendsList = options.extends || [];
		runtimeEnv = (options.runtimeEnv || {}) as Dict<string>;
		isServer = isForceServer() || !!context?.isServer;

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
				// NODE_ENV is implicitly shared
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

	const sourceEnv: Record<string, unknown> = isServer
		? (typeof process !== "undefined" ? process.env : undefined) || {}
		: globalConfig ||
			(typeof process !== "undefined" ? process.env : undefined) ||
			{};

	let extendedEnvValues: Record<string, unknown> = {};
	const allKeys = new Set<string>();
	const serverOnlyKeys = new Set<string>();

	// Add local keys
	for (const key of Object.keys(server)) {
		allKeys.add(key);
		if (!(key in client) && !(key in shared)) {
			serverOnlyKeys.add(key);
		}
	}
	for (const key of Object.keys(client)) {
		allKeys.add(key);
	}
	for (const key of Object.keys(shared)) {
		allKeys.add(key);
	}

	// Prepare combined environment for core validation
	const combinedEnv: Record<string, unknown> = {};

	// Process extended environments
	if (extendsList && Array.isArray(extendsList)) {
		for (const ext of extendsList) {
			if (ext && (typeof ext === "object" || typeof ext === "function")) {
				const raw = (ext as Record<string | symbol, unknown>)[EXTENDED_ENV];
				if (raw) {
					extendedEnvValues = {
						...extendedEnvValues,
						...(raw as Record<string, unknown>),
					};

					const extKeys = (ext as Record<string | symbol, unknown>)[ENV_KEYS];
					if (extKeys instanceof Set) {
						for (const key of extKeys) allKeys.add(key);
					}

					const extServerOnly = (ext as Record<string | symbol, unknown>)[
						SERVER_ONLY_KEYS
					];
					if (extServerOnly instanceof Set) {
						for (const key of extServerOnly) serverOnlyKeys.add(key);
					}
				} else {
					// Prepare what we have so far for validating the extended schema
					for (const key of Object.keys(extendedEnvValues)) {
						if (extendedEnvValues[key] !== undefined) {
							combinedEnv[key] = extendedEnvValues[key];
						}
					}
					for (const key of Object.keys(sourceEnv)) {
						if (sourceEnv[key] !== undefined) {
							combinedEnv[key] = sourceEnv[key];
						}
					}
					if (isServer) {
						for (const key of Object.keys(server)) {
							if (
								combinedEnv[key] === undefined &&
								process.env[key] !== undefined
							) {
								combinedEnv[key] = process.env[key];
							}
						}
					}

					const validated = coreArkenv(ext as SchemaShape, {
						env: combinedEnv as Dict<string>,
						safe: false,
					});
					extendedEnvValues = { ...extendedEnvValues, ...validated };

					const extKeys = getSchemaKeys(ext);
					for (const key of extKeys) {
						allKeys.add(key);
						// Only classify as server-only when running on the server and the key is not public.
						if (
							isServer &&
							!key.startsWith("NUXT_PUBLIC_") &&
							!context?.isShared
						) {
							serverOnlyKeys.add(key);
						}
					}
				}
			}
		}
	}

	// Remove keys from serverOnlyKeys if they are defined as client or shared locally
	for (const key of Object.keys(client)) {
		serverOnlyKeys.delete(key);
	}
	for (const key of Object.keys(shared)) {
		serverOnlyKeys.delete(key);
	}

	// Validate options
	// For client keys, check prefix
	for (const key of Object.keys(client)) {
		if (!key.startsWith("NUXT_PUBLIC_")) {
			throw new Error(
				`Client-side environment variables must be prefixed with 'NUXT_PUBLIC_'. Found invalid key: ${key}`,
			);
		}
	}

	// Build final combinedEnv
	for (const key of Object.keys(extendedEnvValues)) {
		if (extendedEnvValues[key] !== undefined) {
			combinedEnv[key] = extendedEnvValues[key];
		}
	}

	for (const key of Object.keys(sourceEnv)) {
		if (sourceEnv[key] !== undefined) {
			combinedEnv[key] = sourceEnv[key];
		}
	}

	for (const key of Object.keys(runtimeEnv)) {
		if (runtimeEnv[key] !== undefined) {
			combinedEnv[key] = runtimeEnv[key];
		}
	}

	if (isServer) {
		// Fallback server keys to process.env if omitted or undefined
		for (const key of Object.keys(server)) {
			if (combinedEnv[key] === undefined && process.env[key] !== undefined) {
				combinedEnv[key] = process.env[key];
			}
		}
	}

	// Select schema based on environment
	const schema = isServer
		? { ...server, ...client, ...shared }
		: { ...client, ...shared };

	// Run core validation
	const validated = coreArkenv(schema as SchemaShape, {
		env: combinedEnv as Dict<string>,
		safe: false,
	});

	const mergedValidated = { ...extendedEnvValues, ...validated } as Record<
		string,
		unknown
	>;

	// Return a Proxy wrapper with strict access rules to prevent server variable leakage on the client.
	// Always serve the coerced validation target — never re-read raw runtimeConfig / process.env /
	// __NUXT__ strings, which would silently undo ADR 0002 coercion.
	return createSecurityProxy(
		mergedValidated,
		allKeys,
		serverOnlyKeys,
		isServer,
	);
}

/**
 * Wrap the validated environment object in a Proxy to enforce client/server security access rules.
 *
 * Schema-key reads always return the coerced validation target. Raw `useRuntimeConfig()` /
 * `process.env` / `__NUXT__.config.public` strings are intentionally not preferred on get —
 * those sources feed validation at create time, but serving them again would bypass coercion.
 *
 * @param target The validated and coerced environment object
 * @param allKeys The set of all keys defined in the schema (including extended schemas)
 * @param serverOnlyKeys The set of keys that must not be accessed on the client
 * @param isServer Whether the proxy is running in a server context
 * @returns A Proxy that enforces access rules while preserving coerced value types
 */
function createSecurityProxy(
	target: Record<string, unknown>,
	allKeys: Set<string>,
	serverOnlyKeys: Set<string>,
	isServer: boolean,
): unknown {
	return new Proxy(target, {
		get(target, prop, receiver) {
			if (prop === EXTENDED_ENV) {
				return target;
			}
			if (prop === ENV_KEYS) {
				return allKeys;
			}
			if (prop === SERVER_ONLY_KEYS) {
				return serverOnlyKeys;
			}

			// Always allow symbol properties (Symbol.iterator, Symbol.toStringTag, etc.)
			if (typeof prop === "symbol") {
				return Reflect.get(target, prop, receiver);
			}

			if (typeof prop === "string") {
				if (serverOnlyKeys.has(prop) && !isServer) {
					throw new Error(
						`Accessing server-side environment variable '${prop}' on the client is not allowed.`,
					);
				}

				// Allow schema keys and standard Object prototype properties
				if (!allKeys.has(prop) && !(prop in Object.prototype)) {
					// Fallback for bundler/framework-specific properties that bypass the prototype
					const isCommonKey =
						prop === "__esModule" ||
						prop === "$$typeof" ||
						prop === "toJSON" ||
						prop === "inspect" ||
						prop.startsWith("__v_");

					if (!isCommonKey) {
						throw new Error(
							`Environment variable '${prop}' is not defined in the schema.`,
						);
					}
				}
			}
			return Reflect.get(target, prop, receiver);
		},
		// Intercept Object.keys(), Object.getOwnPropertyNames(), Reflect.ownKeys()
		// to prevent enumerating server-only keys on the client
		ownKeys(target) {
			const keys = Reflect.ownKeys(target);
			if (!isServer) {
				return keys.filter(
					(k) => typeof k !== "string" || !serverOnlyKeys.has(k),
				);
			}
			return keys;
		},
		// Intercept Object.getOwnPropertyDescriptor() to hide server-only properties on the client
		getOwnPropertyDescriptor(target, prop) {
			if (!isServer && typeof prop === "string" && serverOnlyKeys.has(prop)) {
				return undefined;
			}
			return Reflect.getOwnPropertyDescriptor(target, prop);
		},
		// Intercept "key in obj" existence checks to hide server-only keys on the client
		has(target, prop) {
			if (!isServer && typeof prop === "string" && serverOnlyKeys.has(prop)) {
				return false;
			}
			return Reflect.has(target, prop);
		},
	});
}
