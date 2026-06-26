import type { Dict, SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv } from "arkenv";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

let hasWarnedLegacy = false;

function getSchemaKeys(schema: any): string[] {
	if (!schema || (typeof schema !== "object" && typeof schema !== "function")) {
		return [];
	}

	// ArkType Type
	if (
		schema.json &&
		typeof schema.json === "object" &&
		schema.json.domain === "object"
	) {
		const keys: string[] = [];
		if (Array.isArray(schema.json.required)) {
			for (const r of schema.json.required) {
				if (r && typeof r === "object" && "key" in r) {
					keys.push(r.key);
				}
			}
		}
		if (Array.isArray(schema.json.optional)) {
			for (const o of schema.json.optional) {
				if (o && typeof o === "object" && "key" in o) {
					keys.push(o.key);
				}
			}
		}
		return keys;
	}

	// Zod schema
	if ("shape" in schema && schema.shape && typeof schema.shape === "object") {
		return Object.keys(schema.shape);
	}

	// Valibot schema
	if (
		"entries" in schema &&
		schema.entries &&
		typeof schema.entries === "object"
	) {
		return Object.keys(schema.entries);
	}

	// Plain object schema
	return Object.keys(schema);
}

/**
 * Validate and wrap environment variables in a security proxy.
 *
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
	let client: SchemaShape = {};
	let shared: SchemaShape = {};
	let extendsList: unknown[] = [];
	let runtimeEnv: Dict<string> = {};
	let isServer = false;

	if (typeof optionsOrIsServer === "boolean") {
		if (process.env.NODE_ENV === "development" && !hasWarnedLegacy) {
			hasWarnedLegacy = true;
			console.warn(
				"⚠️ [arkenv] Deprecated: The nested layout structure (specifying 'server', 'client', or 'shared' keys in createEnv) is deprecated and will be removed in the next major version. Please migrate to the flat layout. See migration guide: https://arkenv.js.org/docs/nextjs/migration/nested-to-flat",
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
		isServer = !!context?.isServer;

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

					const validated = coreCreateEnv(ext as any, { env: combinedEnv });
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
	const validated = coreCreateEnv(schema as any, { env: combinedEnv });

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
