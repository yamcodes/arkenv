import type { Dict, SchemaShape } from "@repo/types";
import { getSchemaKeys } from "@repo/utils";
import { getBootGateResult } from "./boot-gate-state";
import { createCaptureStub, isCapturing, recordCapture } from "./capture";
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

export type ArkenvInternalHooks = {
	/**
	 * Run the Nuxt boot gate before reading values (server thin path only).
	 */
	ensureBootGate?: () => void;
};

/**
 * Partition a schema into server/client/shared buckets and wrap coerced values
 * in a security proxy — without running core validation.
 *
 * On Nuxt, `createEnv` / core validation runs in the Nitro boot gate. This
 * function is the symmetric thin accessor: server and client both read the
 * already-coerced `runtimeConfig` / `__NUXT__` payload.
 *
 * @param schemaOrOptions The schema definition or the unified options object
 * @param optionsOrIsServer The options object or a boolean indicating if running on the server
 * @param context The optional execution context containing server and entrypoint flags
 * @param hooks Optional server hooks (boot gate)
 * @returns The wrapped environment proxy object
 * @throws An error if a required key is missing from the payload or a server key is read on the client
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
	hooks?: ArkenvInternalHooks,
): unknown {
	if (isCapturing()) {
		recordCapture(schemaOrOptions, optionsOrIsServer, context);
		const keys = collectDeclaredKeys(
			schemaOrOptions,
			optionsOrIsServer,
			context,
		);
		return createCaptureStub(keys);
	}

	let server: SchemaShape = {};
	let client: Record<string, unknown> = {};
	let shared: SchemaShape = {};
	let extendsList: readonly unknown[] = [];
	let runtimeEnv: Dict<string> = {};
	let isServer = false;

	if (typeof optionsOrIsServer === "boolean") {
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
		const flatSchema = (schemaOrOptions || {}) as SchemaShape;
		const options = optionsOrIsServer || {};
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

	if (isServer) {
		hooks?.ensureBootGate?.();
	}

	const sourceEnv = readThinSourceEnv(isServer);

	let extendedEnvValues: Record<string, unknown> = {};
	const allKeys = new Set<string>();
	const serverOnlyKeys = new Set<string>();

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
				} else if (
					typeof ext === "object" &&
					ext !== null &&
					!Array.isArray(ext)
				) {
					// Raw schema in extends (e.g. SharedSchema) — keys only; values from source
					const extKeys = getSchemaKeys(ext as SchemaShape);
					for (const key of extKeys) {
						allKeys.add(key);
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

	for (const key of Object.keys(client)) {
		serverOnlyKeys.delete(key);
	}
	for (const key of Object.keys(shared)) {
		serverOnlyKeys.delete(key);
	}

	for (const key of Object.keys(client)) {
		if (!key.startsWith("NUXT_PUBLIC_")) {
			throw new Error(
				`Client-side environment variables must be prefixed with 'NUXT_PUBLIC_'. Found invalid key: ${key}`,
			);
		}
	}

	const values: Record<string, unknown> = {};

	for (const key of allKeys) {
		if (runtimeEnv[key] !== undefined) {
			values[key] = runtimeEnv[key];
		} else if (extendedEnvValues[key] !== undefined) {
			values[key] = extendedEnvValues[key];
		} else if (sourceEnv[key] !== undefined) {
			values[key] = sourceEnv[key];
		}
	}

	return createSecurityProxy(values, allKeys, serverOnlyKeys, isServer);
}

/**
 * Read the thin env source: boot-gate result / process.env on server, `__NUXT__` on client.
 *
 * @param isServer Whether this accessor is on the server
 * @returns Flat key→value map of already-coerced (or raw test) values
 */
function readThinSourceEnv(isServer: boolean): Record<string, unknown> {
	if (!isServer) {
		const globalConfig =
			typeof window !== "undefined"
				? (
						window as {
							__NUXT__?: { config?: { public?: Record<string, unknown> } };
						}
					).__NUXT__?.config?.public
				: undefined;
		return (
			globalConfig ||
			(typeof process !== "undefined" ? process.env : undefined) ||
			{}
		);
	}

	const gated = getBootGateResult();
	if (gated) {
		return gated;
	}

	return (typeof process !== "undefined" ? process.env : undefined) || {};
}

/**
 * Collect declared schema key names for capture stubs.
 *
 * @param schemaOrOptions Schema or nested options
 * @param optionsOrIsServer Flat options or legacy boolean
 * @param context Optional layout context
 * @returns Declared key names
 */
function collectDeclaredKeys(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	_context:
		| {
				isServer: boolean;
				isShared?: boolean;
				strictLayout?: "client" | "server";
		  }
		| undefined,
): string[] {
	if (typeof optionsOrIsServer === "boolean") {
		const legacy = schemaOrOptions as LegacyNestedSchema;
		return [
			...Object.keys(legacy?.server || {}),
			...Object.keys(legacy?.client || {}),
			...Object.keys(legacy?.shared || {}),
		];
	}

	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		const legacy = schemaOrOptions as LegacyNestedSchema;
		return [
			...Object.keys(legacy.server || {}),
			...Object.keys(legacy.client || {}),
			...Object.keys(legacy.shared || {}),
		];
	}

	return Object.keys((schemaOrOptions || {}) as SchemaShape);
}

/**
 * Wrap the env object in a Proxy to enforce client/server security access rules.
 *
 * @param target Coerced env values
 * @param allKeys All schema keys
 * @param serverOnlyKeys Keys that must not be readable on the client
 * @param isServer Whether this proxy is on the server
 * @returns The security proxy
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

			if (typeof prop === "symbol") {
				return Reflect.get(target, prop, receiver);
			}

			if (typeof prop === "string") {
				if (serverOnlyKeys.has(prop) && !isServer) {
					throw new Error(
						`Accessing server-side environment variable '${prop}' on the client is not allowed.`,
					);
				}

				if (!allKeys.has(prop) && !(prop in Object.prototype)) {
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
		ownKeys(target) {
			const keys = Reflect.ownKeys(target);
			if (!isServer) {
				return keys.filter(
					(k) => typeof k !== "string" || !serverOnlyKeys.has(k),
				);
			}
			return keys;
		},
		getOwnPropertyDescriptor(target, prop) {
			if (!isServer && typeof prop === "string" && serverOnlyKeys.has(prop)) {
				return undefined;
			}
			return Reflect.getOwnPropertyDescriptor(target, prop);
		},
		has(target, prop) {
			if (!isServer && typeof prop === "string" && serverOnlyKeys.has(prop)) {
				return false;
			}
			return Reflect.has(target, prop);
		},
	});
}
