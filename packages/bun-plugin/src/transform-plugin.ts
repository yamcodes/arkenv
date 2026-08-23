import fs from "node:fs";
import path from "node:path";
import {
	CLIENT_SECURITY_ERROR,
	classifyEnvKeys,
	generateClientEnvModule,
	isEnvModuleId,
	isServerSchemaImport,
	loadValidatedEnv,
	normalizePrefixes,
	resolveEnvModulePath,
	resolveLayout,
} from "@arkenv/build";
import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import type { BunPlugin } from "bun";
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
 * @returns A Bun plugin that rewrites `env.ts` in browser bundles and blocks server schema imports
 */
export function createTransformPlugin(
	pluginName: string,
	transformOptions: BunPluginFactoryConfig,
	factoryLogOptions?: ArkEnvLogOptions,
): BunPlugin {
	const {
		schemaPath: schemaPathOption,
		layout: layoutOption,
		clientPrefix: clientPrefixOption,
		...configWithoutTransformKeys
	} = transformOptions;
	const { pluginConfig, logOptions } = splitPluginConfig(
		configWithoutTransformKeys,
	);
	const buildLog = resolveBuildLog({ ...factoryLogOptions, ...logOptions });

	const state: {
		resolvedLayout?: "simple" | "strict";
		baseDir?: string;
		schemaPath?: string;
		clientPath?: string;
		serverPath?: string;
		prefixes: string[];
		clientValues: Record<string, unknown>;
		serverKeys: string[];
		transformedSource?: string;
	} = {
		prefixes: normalizePrefixes(clientPrefixOption, ["BUN_PUBLIC_"]),
		clientValues: {},
		serverKeys: [],
	};

	/**
	 * Reload validated env values and key classification from the env module.
	 */
	const refreshTransformState = () => {
		const targetPath =
			state.resolvedLayout === "strict" ? state.clientPath : state.schemaPath;
		if (!targetPath || !fs.existsSync(targetPath)) return;

		const loaded = {
			...process.env,
			...(pluginConfig.env as Record<string, string | undefined> | undefined),
		};

		const validated = loadValidatedEnv(targetPath, loaded, {
			prefix: "ArkEnv Bun plugin:",
		});
		const content = fs.readFileSync(targetPath, "utf8");
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
		state.serverKeys = state.resolvedLayout === "strict" ? [] : serverKeys;
		state.transformedSource = generateClientEnvModule(
			clientValues,
			state.serverKeys,
		);
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
					const discovered = resolveEnvModulePath(
						process.cwd(),
						schemaPathOption,
						"ArkEnv Bun plugin:",
					);
					const layoutResult = resolveLayout(discovered, layoutOption);
					state.resolvedLayout = layoutResult.layout;
					state.baseDir = layoutResult.baseDir;

					if (state.resolvedLayout === "strict") {
						state.clientPath = path.join(state.baseDir, "client.ts");
						state.serverPath = path.join(state.baseDir, "server.ts");
						state.schemaPath = state.clientPath;
					} else {
						state.schemaPath = discovered;
					}

					state.prefixes = normalizePrefixes(clientPrefixOption, [
						"BUN_PUBLIC_",
					]);
					refreshTransformState();
				} catch (error: unknown) {
					buildLog.logBuildErrorWithCause(
						"Environment validation failed",
						error,
					);
					throw error;
				}
			});

			if (typeof build.onResolve === "function") {
				build.onResolve({ filter: /.*/ }, (args) => {
					if (state.resolvedLayout === "strict" && state.baseDir) {
						if (
							isServerSchemaImport(
								args.path,
								args.importer,
								state.baseDir,
								process.cwd(),
							)
						) {
							buildLog.logBuildErrorWithCause(
								"Client security error",
								new Error(CLIENT_SECURITY_ERROR),
							);
							throw new Error(CLIENT_SECURITY_ERROR);
						}
					}
					return undefined;
				});
			}

			build.onLoad({ filter: /\.(m|c)?[jt]sx?$/ }, (args) => {
				if (state.resolvedLayout === "strict" && state.baseDir) {
					if (
						isServerSchemaImport(
							args.path,
							undefined,
							state.baseDir,
							process.cwd(),
						)
					) {
						throw new Error(CLIENT_SECURITY_ERROR);
					}
					if (state.clientPath && isEnvModuleId(args.path, state.clientPath)) {
						if (!state.transformedSource) return undefined;
						return {
							contents: state.transformedSource,
							loader: "js",
						};
					}
					return undefined;
				}

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
