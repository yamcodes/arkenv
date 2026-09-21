import type { Dict, SchemaShape } from "@repo/types";
import { boundaryAccessErrorMessage } from "@repo/utils/boundary-access-error";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

export type FlatSchemaOptions = {
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
	exposeToClient?: readonly string[];
};

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @internal
 */
export function arkenvInternal(
	schemaOrOptions: SchemaShape | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | null | undefined,
	context:
		| {
				isServer: boolean;
				isShared?: boolean;
		  }
		| undefined,
	/**
	 * The core arkenv validation function (either `@arkenv/core` or `@arkenv/standard`).
	 */
	coreArkenv: (schema: any, config?: any) => Record<string, unknown>,
	/**
	 * Extracts the declared key names from a schema object.
	 */
	getSchemaKeysArg: (schema: SchemaShape) => string[],
): unknown {
	let server: SchemaShape = {};
	let client: SchemaShape = {};
	let shared: SchemaShape = {};

	const flatSchema = (schemaOrOptions || {}) as SchemaShape;
	const options = optionsOrIsServer || {};
	const extendsList = options.extends || [];
	const runtimeEnv = (options.runtimeEnv || {}) as Dict<string>;
	const isServer =
		(globalThis as any).__arkenv_force_server__ === true || !!context?.isServer;

	if (context?.isShared) {
		shared = flatSchema;
	} else {
		const exposedKeys = options.exposeToClient || [];
		for (const key of Object.keys(flatSchema)) {
			// NODE_ENV is implicitly shared as Next.js automatically inlines and replaces references to process.env.NODE_ENV in browser bundles.
			// See: https://nextjs.org/docs/app/guides/environment-variables
			if (exposedKeys.includes(key) || key === "NODE_ENV") {
				shared[key] = flatSchema[key];
			} else if (key.startsWith("NEXT_PUBLIC_")) {
				client[key] = flatSchema[key];
			} else {
				server[key] = flatSchema[key];
			}
		}
	}

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
						env: combinedEnv as Dict<string>,
					});
					extendedEnvValues = { ...extendedEnvValues, ...validated };

					const extKeys = getSchemaKeysArg(ext);
					for (const key of extKeys) {
						allKeys.add(key);
						// Only classify as server-only when running on the server and the key is not public.
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

	const globalEnv =
		typeof globalThis !== "undefined"
			? (globalThis as any).__arkenv_env__
			: undefined;

	for (const key of Object.keys(runtimeEnv)) {
		if (runtimeEnv[key] !== undefined) {
			combinedEnv[key] = runtimeEnv[key];
		}
		if (globalEnv && globalEnv[key] !== undefined) {
			if (key.startsWith("NEXT_PUBLIC_") || key in client || key in shared) {
				combinedEnv[key] = globalEnv[key];
			}
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
					throw new Error(boundaryAccessErrorMessage(prop));
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
