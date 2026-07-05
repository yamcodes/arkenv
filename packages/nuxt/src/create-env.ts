import type { Dict, SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv, getSchemaKeys } from "arkenv";
// @ts-expect-error
import { useRuntimeConfig } from "#imports";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

let hasWarnedLegacy = false;

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @param schemaOrOptions The schema definition or the unified options object
 * @param optionsOrIsServer The options object or a boolean indicating if running on the server
 * @param context The optional execution context containing server and entrypoint flags
 * @returns The wrapped and validated environment proxy object
 * @throws An error if a required key is missing or invalid
 * @internal
 */
export function createEnvInternal(
	schemaOrOptions: any,
	optionsOrIsServer: any,
	context?: {
		isServer: boolean;
		isShared?: boolean;
		strictLayout?: "client" | "server";
	},
): unknown {
	let server: SchemaShape = {};
	let client: Record<string, unknown> = {};
	let shared: SchemaShape = {};
	let extendsList: unknown[] = [];
	let runtimeEnv: Record<string, unknown> = {};
	let isServer = false;

	let globalConfig =
		typeof window !== "undefined"
			? (window as any).__NUXT__?.config?.public
			: undefined;

	if (!globalConfig && typeof window !== "undefined") {
		try {
			globalConfig = useRuntimeConfig()?.public;
		} catch {}
	}

	if (typeof optionsOrIsServer === "boolean") {
		if (process.env.NODE_ENV === "development" && !hasWarnedLegacy) {
			hasWarnedLegacy = true;
			// biome-ignore lint/suspicious/noConsole: deprecation warning
			console.warn(
				"⚠️ [arkenv] Deprecated: The nested layout structure (specifying 'server', 'client', or 'shared' keys in createEnv) is deprecated and will be removed in the next major version. Please migrate to the flat layout.",
			);
		}
		// Old nested schema behavior (backward compatible)
		server = schemaOrOptions.server || {};
		client = schemaOrOptions.client || {};
		shared = schemaOrOptions.shared || {};
		extendsList = schemaOrOptions.extends || [];
		runtimeEnv = schemaOrOptions.runtimeEnv || {};
		isServer = optionsOrIsServer;
	} else {
		// New flat schema behavior
		const flatSchema = schemaOrOptions || {};
		const options = optionsOrIsServer || {};
		extendsList = options.extends || [];
		runtimeEnv = options.runtimeEnv || {};
		isServer =
			(globalThis as any).__arkenv_force_server__ === true ||
			!!context?.isServer;

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
				// NODE_ENV is implicitly shared as Nuxt automatically inlines and replaces references to process.env.NODE_ENV in browser bundles.
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

	let serverRuntimeConfig: any;
	if (isServer) {
		try {
			serverRuntimeConfig = useRuntimeConfig();
		} catch {}
	}

	const sourceEnv: Record<string, unknown> = isServer
		? {
				...((typeof process !== "undefined" ? process.env : undefined) || {}),
				...serverRuntimeConfig,
			}
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
				const raw = (ext as any)[EXTENDED_ENV];
				if (raw) {
					extendedEnvValues = { ...extendedEnvValues, ...raw };

					const extKeys = (ext as any)[ENV_KEYS];
					if (extKeys instanceof Set) {
						for (const key of extKeys) allKeys.add(key);
					}

					const extServerOnly = (ext as any)[SERVER_ONLY_KEYS];
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

					const validated = coreCreateEnv(ext as any, {
						env: combinedEnv as Dict<string>,
					});
					extendedEnvValues = { ...extendedEnvValues, ...validated };

					const extKeys = getSchemaKeys(ext);
					for (const key of extKeys) {
						allKeys.add(key);
						// Only classify as server-only if we are on the server, it's not a public key,
						// and we aren't explicitly inside the shared entry point.
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

	// Check runtimeEnv does not have any keys not defined in the schema (allKeys)
	for (const key of Object.keys(runtimeEnv)) {
		if (!allKeys.has(key)) {
			throw new Error(
				`Environment variable '${key}' is passed to runtimeEnv but is not defined in the schema.`,
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
	const validated = coreCreateEnv(schema as any, {
		env: combinedEnv as Dict<string>,
	});

	const mergedValidated = { ...extendedEnvValues, ...validated } as Record<
		string,
		unknown
	>;

	// Return a Proxy wrapper with strict access rules to prevent server variable leakage on the client
	return createSecurityProxy(
		mergedValidated,
		allKeys,
		serverOnlyKeys,
		isServer,
		runtimeEnv,
	);
}

/**
 * Wraps the validated environment object in a Proxy to enforce client/server security access rules.
 */
function createSecurityProxy(
	target: Record<string, unknown>,
	allKeys: Set<string>,
	serverOnlyKeys: Set<string>,
	isServer: boolean,
	runtimeEnv: Record<string, unknown> = {},
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

				if (allKeys.has(prop)) {
					if (typeof window !== "undefined") {
						if (runtimeEnv && prop in runtimeEnv) {
							return Reflect.get(target, prop, receiver);
						}
						try {
							const runtimeConfig = useRuntimeConfig();
							if (runtimeConfig?.public && prop in runtimeConfig.public) {
								return runtimeConfig.public[prop];
							}
						} catch {
							// fallback if useRuntimeConfig is not available yet
						}
						const globalPublic = (window as any).__NUXT__?.config?.public;
						if (globalPublic && prop in globalPublic) {
							return globalPublic[prop];
						}
					} else {
						if (runtimeEnv && prop in runtimeEnv) {
							return Reflect.get(target, prop, receiver);
						}
						try {
							const runtimeConfig = useRuntimeConfig();
							if (runtimeConfig) {
								if (prop in runtimeConfig && runtimeConfig[prop] !== "") {
									return runtimeConfig[prop];
								}
								if (runtimeConfig.public && prop in runtimeConfig.public && runtimeConfig.public[prop] !== "") {
									return runtimeConfig.public[prop];
								}
							}
						} catch {
							// fallback
						}
						if (
							typeof process !== "undefined" &&
							process.env &&
							prop in process.env
						) {
							return process.env[prop];
						}
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
