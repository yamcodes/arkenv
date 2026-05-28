import type { SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv } from "arkenv";

export const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
export const ENV_KEYS = Symbol.for("arkenv.keys");
export const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @internal
 *
 * @remarks
 * This internal module contains the core Next.js environment validation logic. It is split from
 * the public entry points to separate execution paths (RSC vs. SSR/Client) at the bundler layer.
 *
 * @param options The environment validation configuration options
 * @param isServer Whether the code is running in a server component (RSC) context
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NEXT_PUBLIC_`
 * @throws An error if any client or shared variable is missing from `runtimeEnv`
 */
export function createEnvInternal(
	options: {
		server?: SchemaShape;
		client?: Record<string, unknown>;
		shared?: SchemaShape;
		extends?: unknown[];
		runtimeEnv: Record<string, unknown>;
	},
	isServer: boolean,
): unknown {
	const server = options.server || {};
	const client = options.client || {};
	const shared = options.shared || {};
	const runtimeEnv = options.runtimeEnv;

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

	// Process extended environments
	if (options.extends && Array.isArray(options.extends)) {
		for (const ext of options.extends) {
			if (ext && typeof ext === "object") {
				const raw = (ext as any)[EXTENDED_ENV] || ext;
				extendedEnvValues = { ...extendedEnvValues, ...raw };

				const extKeys = (ext as any)[ENV_KEYS];
				if (extKeys instanceof Set) {
					for (const key of extKeys) {
						allKeys.add(key);
					}
				} else {
					for (const key of Object.keys(raw)) {
						allKeys.add(key);
					}
				}

				const extServerOnly = (ext as any)[SERVER_ONLY_KEYS];
				if (extServerOnly instanceof Set) {
					for (const key of extServerOnly) {
						serverOnlyKeys.add(key);
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

	// Prepare combined environment for core validation
	const combinedEnv: Record<string, string | undefined> = {};

	for (const key of Object.keys(extendedEnvValues)) {
		if (extendedEnvValues[key] !== undefined) {
			combinedEnv[key] = String(extendedEnvValues[key]);
		}
	}

	for (const key of Object.keys(runtimeEnv)) {
		if (runtimeEnv[key] !== undefined) {
			combinedEnv[key] = runtimeEnv[key] as string;
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
	// Note: We cast schema to `any` here to avoid a compilation TS2589 error
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

			if (typeof prop === "string") {
				if (serverOnlyKeys.has(prop) && !isServer) {
					throw new Error(
						`Accessing server-side environment variable '${prop}' on the client is not allowed.`,
					);
				}

				const isCommonKey =
					prop === "default" ||
					prop === "__esModule" ||
					prop === "$$typeof" ||
					prop === "toJSON" ||
					prop === "toString" ||
					prop === "valueOf" ||
					prop === "constructor" ||
					prop === "inspect";

				if (!allKeys.has(prop) && !isCommonKey) {
					throw new Error(
						`Environment variable '${prop}' is not defined in the schema.`,
					);
				}
			}
			return Reflect.get(target, prop, receiver);
		},
	});
}
