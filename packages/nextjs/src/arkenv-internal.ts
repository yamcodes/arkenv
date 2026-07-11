import { logBuildWarning } from "@arkenv/build/log";
import type { Dict, SchemaShape } from "@repo/types";

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

let hasWarnedLegacy = false;

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @internal
 */
export function arkenvInternal(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	context:
		| {
				isServer: boolean;
				strictLayout?: "client" | "server";
		  }
		| undefined,
	/** The core arkenv validation function (either `@arkenv/core` or `@arkenv/standard`). */
	coreArkenv: (schema: any, config?: any) => Record<string, unknown>,
	/** Extracts the declared key names from a schema object. */
	getSchemaKeysArg: (schema: SchemaShape) => string[],
): unknown {
	let server: SchemaShape = {};
	let client: SchemaShape = {};
	let shared: SchemaShape = {};
	let extendsList: readonly unknown[] = [];
	let runtimeEnv: Dict<string> = {};
	let isServer = false;

	if (typeof optionsOrIsServer === "boolean") {
		if (process.env.NODE_ENV === "development" && !hasWarnedLegacy) {
			hasWarnedLegacy = true;
			logBuildWarning(
				"Deprecated: The nested layout structure (specifying 'server', 'client', or 'shared' keys in arkenv) is deprecated and will be removed in the next major version. Please migrate to the flat layout. See guide: https://arkenv.js.org/docs/nextjs/faq#how-do-i-define-client-side-variables",
			);
		}
		// Old nested schema behavior (backward compatible)
		const legacySchema = schemaOrOptions as
			| LegacyNestedSchema
			| null
			| undefined;
		server = (legacySchema?.server || {}) as SchemaShape;
		client = (legacySchema?.client || {}) as SchemaShape;
		shared = (legacySchema?.shared || {}) as SchemaShape;
		extendsList = legacySchema?.extends || [];
		runtimeEnv = (legacySchema?.runtimeEnv || {}) as Dict<string>;
		isServer =
			(globalThis as any).__arkenv_force_server__ === true ||
			!!optionsOrIsServer;
	} else {
		// New flat schema behavior
		const flatSchema = (schemaOrOptions || {}) as SchemaShape;
		const options = optionsOrIsServer || {};
		extendsList = options.extends || [];
		runtimeEnv = (options.runtimeEnv || {}) as Dict<string>;
		isServer =
			(globalThis as any).__arkenv_force_server__ === true ||
			!!context?.isServer;

		if (context?.strictLayout === "client") {
			client = flatSchema;
		} else if (context?.strictLayout === "server") {
			server = flatSchema;
		} else {
			const exposedKeys =
				options.exposeToClient || options.expose || options.shared || [];
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
						safe: false,
					});
					extendedEnvValues = { ...extendedEnvValues, ...validated };

					const extKeys = getSchemaKeysArg(ext);
					for (const key of extKeys) {
						allKeys.add(key);
						// Only classify as server-only when running on the server and the key is not public.
						if (isServer && !key.startsWith("NEXT_PUBLIC_")) {
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
						`ArkEnv Error: Attempted to access server environment variable '${prop}' on the client.`,
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
