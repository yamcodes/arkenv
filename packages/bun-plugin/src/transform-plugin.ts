import fs from "node:fs";
import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import type { BunPlugin } from "bun";
import { classifyEnvKeys } from "./classify-env-keys";
import {
	isEnvModuleId,
	normalizePrefixes,
	resolveEnvModulePath,
} from "./env-module-path";
import { generateClientEnvModule } from "./generate-client-env-module";
import { loadValidatedEnv } from "./load-validated-env";
import type { BunPluginFactoryConfig } from "./plugin-config";

/**
 * Build the env-module transform plugin (browser rewrite; server passthrough).
 *
 * Scoped to `target: "browser"` so `bun run` / `Bun.serve` server code executes
 * `env.ts` as-is against the real deployment environment.
 *
 * @param pluginName The Bun plugin name
 * @param transformOptions Plugin options including `schemaPath` / `clientPrefix`
 * @param factoryLogOptions Default logging options from the factory
 * @param factoryOptions Optional factory options (e.g. `isStandard` for error examples)
 * @returns A Bun plugin that rewrites `env.ts` in browser bundles
 */
export function createTransformPlugin(
	pluginName: string,
	transformOptions: BunPluginFactoryConfig,
	factoryLogOptions?: ArkEnvLogOptions,
	factoryOptions?: { isStandard?: boolean },
): BunPlugin {
	const {
		schemaPath: schemaPathOption,
		clientPrefix: clientPrefixOption,
		...configWithoutTransformKeys
	} = transformOptions;
	const { pluginConfig, logOptions } = splitPluginConfig(
		configWithoutTransformKeys,
	);
	const buildLog = resolveBuildLog({ ...factoryLogOptions, ...logOptions });

	const state: {
		schemaPath?: string;
		prefixes: string[];
		clientValues: Record<string, unknown>;
		serverKeys: string[];
		transformedSource?: string;
	} = {
		prefixes: normalizePrefixes(clientPrefixOption),
		clientValues: {},
		serverKeys: [],
	};

	/**
	 * Reload validated env values and key classification from the env module.
	 */
	const refreshTransformState = () => {
		if (!state.schemaPath) return;

		const loaded = {
			...process.env,
			...(pluginConfig.env as Record<string, string | undefined> | undefined),
		};

		const validated = loadValidatedEnv(state.schemaPath, loaded);
		const content = fs.readFileSync(state.schemaPath, "utf8");
		const { clientKeys, sharedKeys, serverKeys } = classifyEnvKeys(
			content,
			state.prefixes,
		);

		const inlineKeys = new Set([...clientKeys, ...sharedKeys]);
		const clientValues: Record<string, unknown> = {};
		for (const key of inlineKeys) {
			if (key in validated) {
				clientValues[key] = validated[key];
			}
		}

		state.clientValues = clientValues;
		state.serverKeys = serverKeys;
		state.transformedSource = generateClientEnvModule(clientValues, serverKeys);
	};

	return {
		name: pluginName,
		/**
		 * Only apply to browser / `[serve.static]` graphs. Server runtime loads
		 * `env.ts` through Bun's native module loader without this plugin.
		 */
		target: "browser",
		setup(build) {
			/**
			 * Rewrite the env module in browser bundles only.
			 *
			 * @remarks
			 * ADR 0021 (canonical env object surface): do not reintroduce `env.gen.ts`
			 * codegen, client-side re-validation, or `runtimeEnv` wiring here.
			 *
			 * Dev-server refresh: `onStart` re-validates on each `Bun.build` /
			 * `[serve.static]` rebuild. Bun does not expose a Vite-style
			 * `handleHotUpdate` hook, so editing `.env` / `env.ts` during an
			 * already-running `Bun.serve` requires a server restart (or a rebuild
			 * that re-invokes `onStart`) to refresh inlined client values.
			 */
			build.onStart(() => {
				try {
					state.schemaPath = resolveEnvModulePath(
						process.cwd(),
						schemaPathOption,
						factoryOptions,
					);
					state.prefixes = normalizePrefixes(clientPrefixOption);
					refreshTransformState();
				} catch (error: unknown) {
					buildLog.logBuildErrorWithCause(
						"Environment validation failed",
						error,
					);
					throw error;
				}
			});

			build.onLoad({ filter: /\.(m|c)?[jt]sx?$/ }, (args) => {
				if (!state.schemaPath) return undefined;
				if (!isEnvModuleId(args.path, state.schemaPath)) return undefined;
				if (!state.transformedSource) return undefined;

				return {
					contents: state.transformedSource,
					loader: "js",
				};
			});
		},
	} satisfies BunPlugin;
}
