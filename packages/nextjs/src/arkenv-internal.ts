import type { Dict, SchemaShape } from "@repo/types";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

export type LegacyNestedSchema = {
	server?: SchemaShape;
	client?: SchemaShape;
	shared?: SchemaShape;
	extends?: unknown[];
	runtimeEnv?: Dict<string>;
};

export type FlatSchemaOptions = {
	extends?: unknown[];
	runtimeEnv?: Dict<string>;
};

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @internal
 */
export function arkenvInternal(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	context: { isServer: boolean; isShared?: boolean } | undefined,
	/** The core arkenv validation function (either `@arkenv/core` or `@arkenv/standard`). */
	coreArkenv: (
		schema: SchemaShape,
		config?: { env?: Dict<string>; safe?: boolean },
	) => Record<string, unknown>,
	/** Extracts the declared key names from a schema object. */
	getSchemaKeys: (schema: SchemaShape) => string[],
): unknown {
	let server: SchemaShape = {};
	let client: SchemaShape = {};
	let shared: SchemaShape = {};
	let extendsList: unknown[] = [];
	let runtimeEnv: Dict<string> = {};
	let isServer = false;

	if (typeof optionsOrIsServer === "boolean") {
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
		isServer = !!context?.isServer;

		if (context?.isShared) {
			shared = flatSchema;
		} else if (isServer) {
			server = flatSchema;
		} else {
			client = flatSchema;
		}
	}

	let extendedEnvValues: Dict<string> = {};
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
	const combinedEnv: Dict<string> = {};

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
					for (const key of Object.keys(runtimeEnv)) {
						if (runtimeEnv[key] !== undefined) {
							combinedEnv[key] = runtimeEnv[key];
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
						env: combinedEnv,
						safe: false,
					});
					extendedEnvValues = { ...extendedEnvValues, ...validated };

					const extKeys = getSchemaKeys(ext);
					for (const key of extKeys) {
						allKeys.add(key);
						// Only classify as server-only if we are on the server, it's not a public key,
						// and we aren't explicitly inside the shared entry point.
						if (
							isServer &&
							!key.startsWith("NEXT_PUBLIC_") &&
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
		if (!key.startsWith("NEXT_PUBLIC_")) {
			throw new Error(
				`Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'. Found invalid key: ${key}`,
			);
		}
	}

	// Check runtimeEnv has all local client and shared keys
	const requiredKeys = [...Object.keys(client), ...Object.keys(shared)];
	for (const key of requiredKeys) {
		if (!(key in runtimeEnv)) {
			throw new Error(
				`Missing key in runtimeEnv: ${key}. All client and shared environment variables must be explicitly destructured in runtimeEnv.`,
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
		env: combinedEnv,
		safe: false,
	});

	const mergedValidated = { ...extendedEnvValues, ...validated };

	// Return a Proxy wrapper
	return new Proxy(mergedValidated, {
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
						prop === "inspect";

					if (!isCommonKey) {
						throw new Error(
							`Environment variable '${prop}' is not defined in the schema.`,
						);
					}
				}
			}
			return Reflect.get(target, prop, receiver);
		},
	});
}
