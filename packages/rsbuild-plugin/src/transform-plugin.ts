import fs from "node:fs";
import { join } from "node:path";
import {
	classifyEnvKeys,
	generateClientEnvModule,
	isEnvModuleId,
	loadValidatedEnv,
	normalizePrefixes,
	resolveEnvModulePath,
} from "@arkenv/build";
import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import { loadEnv, type RsbuildPlugin } from "@rsbuild/core";
import type { RsbuildPluginFactoryConfig } from "./plugin-config";

/**
 * Build the env-module transform plugin (client rewrite + server passthrough).
 *
 * Scoped to browser targets (`web` / `web-worker`) via `api.transform` so the
 * server (`node`) environment loads `env.ts` as-is against the real deployment
 * environment. Environment validation runs in `onBeforeEnvironmentCompile`,
 * which fails the build before any assets are emitted.
 *
 * @param pluginName The Rsbuild plugin name
 * @param transformOptions Plugin options including `schemaPath` / `clientPrefix`
 * @param factoryLogOptions Default logging options from the factory
 * @returns An Rsbuild plugin that rewrites `env.ts` in client environments
 */
export function createTransformPlugin(
	pluginName: string,
	transformOptions: RsbuildPluginFactoryConfig,
	factoryLogOptions?: ArkEnvLogOptions,
): RsbuildPlugin {
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
		root: string;
		mode: string;
		schemaPath?: string;
		prefixes: string[];
		envFileCandidates: string[];
		clientValues: Record<string, unknown>;
		serverKeys: string[];
		transformedSource?: string;
	} = {
		root: process.cwd(),
		mode: process.env.NODE_ENV ?? "development",
		prefixes: ["PUBLIC_"],
		envFileCandidates: [],
		clientValues: {},
		serverKeys: [],
	};

	/**
	 * Reload validated env values and key classification from the env module.
	 */
	const refreshTransformState = () => {
		if (!state.schemaPath || !fs.existsSync(state.schemaPath)) return;

		const envLoad = loadEnv({
			cwd: state.root,
			mode: state.mode,
			prefixes: state.prefixes,
			processEnv: {},
		});
		const loaded = {
			...envLoad.parsed,
			...process.env,
			...(pluginConfig.env as Record<string, string | undefined> | undefined),
		};

		const validated = loadValidatedEnv(state.schemaPath, loaded, {
			prefix: "ArkEnv Rsbuild plugin:",
		});
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
		state.envFileCandidates = [
			".env",
			".env.local",
			`.env.${state.mode}`,
			`.env.${state.mode}.local`,
		].map((filename) => join(state.root, filename));
		state.transformedSource = generateClientEnvModule(
			clientValues,
			state.serverKeys,
		);
	};

	return {
		name: pluginName,
		setup(api) {
			state.root = api.context.rootPath;
			state.mode =
				process.env.NODE_ENV ??
				(api.context.action === "dev" ? "development" : "production");
			state.prefixes = normalizePrefixes(clientPrefixOption, ["PUBLIC_"]);
			try {
				state.schemaPath = resolveEnvModulePath(
					state.root,
					schemaPathOption,
					"ArkEnv Rsbuild plugin:",
				);
				refreshTransformState();
			} catch (error: unknown) {
				buildLog.logBuildErrorWithCause("Environment validation failed", error);
				throw error;
			}

			/**
			 * Re-validate on every environment compile. In dev watch mode this
			 * also refreshes inlined client values after `.env*` changes.
			 */
			api.onBeforeEnvironmentCompile(() => {
				try {
					state.prefixes = normalizePrefixes(clientPrefixOption, ["PUBLIC_"]);
					refreshTransformState();
				} catch (error: unknown) {
					buildLog.logBuildErrorWithCause(
						"Environment validation failed",
						error,
					);
					throw error;
				}
			});

			/**
			 * Rewrite the env module in browser targets only.
			 *
			 * @remarks
			 * Rsbuild discriminates module graphs through output targets:
			 * `node` (server/SSR) keeps the real module, `web` and `web-worker`
			 * get the client rewrite. The schema and `.env*` files are added as
			 * build dependencies so Rspack re-runs the transform (and
			 * `onBeforeEnvironmentCompile`) when they change during dev.
			 */
			api.transform(
				{
					test: (resource: string) =>
						Boolean(
							state.schemaPath && isEnvModuleId(resource, state.schemaPath),
						),
					targets: ["web", "web-worker"],
					order: "pre",
				},
				({ code, resourcePath, addDependency, addMissingDependency }) => {
					if (!state.schemaPath) return code;
					if (!isEnvModuleId(resourcePath, state.schemaPath)) return code;

					addDependency(state.schemaPath);
					for (const envFile of state.envFileCandidates) {
						if (fs.existsSync(envFile)) {
							addDependency(envFile);
						} else {
							addMissingDependency(envFile);
						}
					}

					return state.transformedSource ?? code;
				},
			);
		},
	};
}
