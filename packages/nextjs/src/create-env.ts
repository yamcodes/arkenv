import type { SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv } from "arkenv";

/**
 * Validate and wrap environment variables in a security proxy.
 *
 * @internal
 *
 * @remarks
 * This internal module contains the core Next.js environment validation logic. It is split from
 * the public entry points to separate execution paths (RSC vs. SSR/Client) at the bundler layer.
 *
 * **Trade-offs & Design Decisions:**
 * 1. **Bundler Resolution (isServer)**: The `isServer` flag is statically hardcoded by the respective
 *    entry points (`src/index.ts` and `src/react-server.ts`) resolved via package conditional exports
 *    (`react-server` vs `default`). This resolves client component SSR environment poisoning without
 *    relying on fragile runtime heuristics.
 * 2. **Type Circuit Breaker (unknown return)**: This function returns `unknown` rather than the complex,
 *    recursive ArkType validation types. This prevents TypeScript's compiler from recursively evaluating
 *    type mapping depths inside the internal implementation, bypassing `TS2589` instantiation limits.
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
		runtimeEnv: Record<string, unknown>;
	},
	isServer: boolean,
): unknown {
	const server = options.server || {};
	const client = options.client || {};
	const shared = options.shared || {};
	const runtimeEnv = options.runtimeEnv;

	// Validate options
	// For client keys, check prefix
	for (const key of Object.keys(client)) {
		if (!key.startsWith("NEXT_PUBLIC_")) {
			throw new Error(
				`Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'. Found invalid key: ${key}`,
			);
		}
	}

	// Check runtimeEnv has all client and shared keys
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
	// (Type instantiation is excessively deep and possibly infinite).
	// Evaluating the full generic intersection schema under `EnvSchema<T>`
	// exceeds TypeScript's instantiation limits for generic components.
	const validated = coreCreateEnv(schema as any, { env: combinedEnv });

	// Return a Proxy wrapper
	return new Proxy(validated, {
		get(target, prop, receiver) {
			if (typeof prop === "string") {
				const isServerOnlyKey =
					prop in server && !(prop in client) && !(prop in shared);
				if (isServerOnlyKey && !isServer) {
					throw new Error(
						`Accessing server-side environment variable '${prop}' on the client is not allowed.`,
					);
				}
			}
			return Reflect.get(target, prop, receiver);
		},
	});
}
