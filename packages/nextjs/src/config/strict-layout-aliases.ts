import type { CLIENT_ENV_SPECIFIER } from "../strict-client-env";

type WebpackConfigLike = {
	resolve?: {
		alias?:
			| Record<string, string | false | string[]>
			| Array<{ name: string; alias: string | false | string[] }>;
	};
	plugins?: unknown[];
};

type WebpackLike = {
	DefinePlugin: new (definitions: Record<string, string>) => unknown;
};

type WebpackContextLike = {
	webpack?: WebpackLike;
};

type TurbopackResolveAlias = Record<string, string | string[]>;

type NextConfigLike = {
	webpack?: (
		config: WebpackConfigLike,
		context: WebpackContextLike,
	) => WebpackConfigLike | undefined;
	turbopack?: {
		resolveAlias?: TurbopackResolveAlias;
		[key: string]: unknown;
	};
	experimental?: {
		turbo?: {
			resolveAlias?: TurbopackResolveAlias;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	env?: Record<string, string | undefined>;
	[key: string]: unknown;
};

/**
 * Merge `#arkenv/client-env` into a webpack `resolve.alias` value (object or array form).
 *
 * @param alias Existing webpack resolve.alias
 * @param specifier Virtual module specifier
 * @param target Absolute path to the project client env module
 * @returns Updated alias value
 */
function mergeWebpackAlias(
	alias:
		| Record<string, string | false | string[]>
		| Array<{ name: string; alias: string | false | string[] }>
		| undefined,
	specifier: string,
	target: string,
):
	| Record<string, string | false | string[]>
	| Array<{ name: string; alias: string | false | string[] }> {
	if (Array.isArray(alias)) {
		const next = alias.filter((entry) => entry.name !== specifier);
		next.push({ name: specifier, alias: target });
		return next;
	}
	return {
		...(alias ?? {}),
		[specifier]: target,
	};
}

/**
 * Apply webpack + Turbopack aliases and a compile-time strict-layout flag.
 *
 * Chains any existing `webpack` function on the user config. Turbopack aliases
 * are written to both `turbopack.resolveAlias` (Next 15+) and
 * `experimental.turbo.resolveAlias` for older configs.
 *
 * @param nextConfig User Next.js config object
 * @param clientEnvPath Absolute path to `env/client.ts`
 * @param specifier Virtual module specifier (typically `#arkenv/client-env`)
 * @returns Next config with strict-layout alias wiring
 */
export function applyStrictLayoutAliases<T extends NextConfigLike>(
	nextConfig: T,
	clientEnvPath: string,
	specifier: typeof CLIENT_ENV_SPECIFIER | string = "#arkenv/client-env",
): T {
	const previousWebpack = nextConfig.webpack;

	const webpack = (config: WebpackConfigLike, context: WebpackContextLike) => {
		const resolved = previousWebpack
			? (previousWebpack(config, context) ?? config)
			: config;
		resolved.resolve = resolved.resolve ?? {};
		resolved.resolve.alias = mergeWebpackAlias(
			resolved.resolve.alias,
			specifier,
			clientEnvPath,
		);

		const DefinePlugin = context.webpack?.DefinePlugin;
		if (DefinePlugin) {
			resolved.plugins = resolved.plugins ?? [];
			resolved.plugins.push(
				new DefinePlugin({
					__ARKENV_STRICT_LAYOUT__: JSON.stringify(true),
				}),
			);
		}

		return resolved;
	};

	const existingTurbopack = nextConfig.turbopack ?? {};
	const existingExperimental = nextConfig.experimental ?? {};
	const existingTurbo = existingExperimental.turbo ?? {};

	const turbopackResolveAlias: TurbopackResolveAlias = {
		...(existingTurbopack.resolveAlias ?? {}),
		[specifier]: clientEnvPath,
	};
	const experimentalTurboResolveAlias: TurbopackResolveAlias = {
		...(existingTurbo.resolveAlias ?? {}),
		[specifier]: clientEnvPath,
	};

	return {
		...nextConfig,
		webpack,
		// Turbopack / non-webpack paths: surface the flag via Next env inlining.
		// Note: Next.js forbids keys with __ prefix in nextConfig.env, so we use
		// ARKENV_STRICT_LAYOUT (no underscores) here. The webpack DefinePlugin
		// path uses __ARKENV_STRICT_LAYOUT__ as a compile-time literal, which is fine.
		env: {
			...(nextConfig.env ?? {}),
			ARKENV_STRICT_LAYOUT: "true",
		},
		turbopack: {
			...existingTurbopack,
			resolveAlias: turbopackResolveAlias,
		},
		experimental: {
			...existingExperimental,
			turbo: {
				...existingTurbo,
				resolveAlias: experimentalTurboResolveAlias,
			},
		},
	} as T;
}
