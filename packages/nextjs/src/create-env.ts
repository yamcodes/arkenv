import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv } from "arkenv";
import type { type as at, distill } from "arktype";

/**
 * Shared core function containing validation and proxy wrapper logic.
 *
 * @param options The environment validation configuration options
 * @param isServer Whether the code is running in a server component (RSC) context
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 */
export function createEnvInternal<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(
	options: {
		server?: TServer;
		client?: {
			[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}`
				? TClient[K]
				: never;
		};
		shared?: TShared;
		runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
			Record<string, unknown>;
	},
	isServer: boolean,
): Readonly<distill.Out<at.infer<TServer & TClient & TShared, $>>> {
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
