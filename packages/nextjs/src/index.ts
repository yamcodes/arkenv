import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import { createEnv as coreCreateEnv } from "arkenv";
import type { type as at, distill } from "arktype";

/**
 * Create a validated, type-safe environment configuration for Next.js applications.
 *
 * @param options The environment validation configuration options
 * @returns A validated, readonly environment variables object wrapped in a security proxy
 * @throws An error if any client-side variable is not prefixed with `NEXT_PUBLIC_`
 * @throws An error if any client or shared variable is missing from `runtimeEnv`
 */
export function createEnv<
	const TServer extends SchemaShape = {},
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
>(options: {
	server?: TServer;
	client?: {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}`
			? TClient[K]
			: never;
	};
	shared?: TShared;
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<distill.Out<at.infer<TServer & TClient & TShared, $>>> {
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
	const isBrowser = typeof window !== "undefined";
	const combinedEnv = { ...runtimeEnv } as Record<string, string | undefined>;

	if (!isBrowser) {
		// Fallback server keys to process.env if omitted from runtimeEnv
		for (const key of Object.keys(server)) {
			if (!(key in combinedEnv)) {
				combinedEnv[key] = process.env[key];
			}
		}
	}

	// Select schema based on environment
	const schema = isBrowser
		? { ...client, ...shared }
		: { ...server, ...client, ...shared };

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
				if (isServerOnlyKey && isBrowser) {
					throw new Error(
						`Accessing server-side environment variable '${prop}' on the client is not allowed.`,
					);
				}
			}
			return Reflect.get(target, prop, receiver);
		},
	});
}

export { type } from "arkenv";

/**
 * ArkEnv's Next.js integration export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
