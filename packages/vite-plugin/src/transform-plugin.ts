import fs from "node:fs";
import path from "node:path";
import {
	CLIENT_SECURITY_ERROR,
	classifyEnvKeys,
	generateClientEnvModule,
	isDotEnvFile,
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
import { loadEnv, type Plugin } from "vite";
import type { VitePluginFactoryConfig } from "./plugin-config";

/**
 * Build the env-module transform plugin (client rewrite + SSR passthrough + strict layout import blocking).
 *
 * @param pluginName The Vite plugin name
 * @param transformOptions Plugin options including `schemaPath` / `clientPrefix`
 * @param factoryLogOptions Default logging options from the factory
 * @returns A Vite plugin that rewrites `env.ts` in the client graph and blocks server schema imports
 */
export function createTransformPlugin(
	pluginName: string,
	transformOptions: VitePluginFactoryConfig,
	factoryLogOptions?: ArkEnvLogOptions,
): Plugin {
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
		mode: string;
		envDir: string;
		root: string;
		clientValues: Record<string, unknown>;
		serverKeys: string[];
	} = {
		prefixes: ["VITE_"],
		mode: "development",
		envDir: process.cwd(),
		root: process.cwd(),
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
			...loadEnv(state.mode, state.envDir, ""),
			...(pluginConfig.env as Record<string, string | undefined> | undefined),
		};

		const validated = loadValidatedEnv(targetPath, loaded, {
			prefix: "ArkEnv Vite plugin:",
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
	};

	return {
		name: pluginName,
		enforce: "pre",
		config(viteConfig, { mode }) {
			state.mode = mode;
			state.envDir =
				typeof viteConfig.envDir === "string"
					? viteConfig.envDir
					: (viteConfig.root ?? process.cwd());
			state.root = viteConfig.root ?? process.cwd();
			state.prefixes = normalizePrefixes(
				clientPrefixOption ?? viteConfig.envPrefix ?? "VITE_",
				["VITE_"],
			);
		},
		configResolved(resolved) {
			state.root = resolved.root;
			state.envDir =
				typeof resolved.envDir === "string" ? resolved.envDir : resolved.root;
			state.prefixes = normalizePrefixes(
				clientPrefixOption ?? resolved.envPrefix ?? "VITE_",
				["VITE_"],
			);

			try {
				const discovered = resolveEnvModulePath(
					resolved.root,
					schemaPathOption,
					"ArkEnv Vite plugin:",
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

				refreshTransformState();
			} catch (error: unknown) {
				buildLog.logBuildErrorWithCause("Environment validation failed", error);
				throw error;
			}
		},
		resolveId(id, importer, options) {
			if (!options?.ssr && state.resolvedLayout === "strict" && state.baseDir) {
				if (isServerSchemaImport(id, importer, state.baseDir, state.root)) {
					if (this.error && typeof this.error === "function") {
						this.error(CLIENT_SECURITY_ERROR);
					}
					throw new Error(CLIENT_SECURITY_ERROR);
				}
			}
			return null;
		},
		/**
		 * Rewrite the env module in the client graph only.
		 *
		 * @remarks
		 * ADR 0021 (canonical env object surface): do not reintroduce `env.gen.ts`
		 * codegen, client-side re-validation, or `runtimeEnv` wiring here.
		 */
		transform(_code, id, options) {
			if (options?.ssr) return null;

			if (state.resolvedLayout === "strict" && state.baseDir) {
				if (isServerSchemaImport(id, undefined, state.baseDir, state.root)) {
					if (this.error && typeof this.error === "function") {
						this.error(CLIENT_SECURITY_ERROR);
					}
					throw new Error(CLIENT_SECURITY_ERROR);
				}
				if (state.clientPath && isEnvModuleId(id, state.clientPath)) {
					return {
						code: generateClientEnvModule(state.clientValues, state.serverKeys),
						map: null,
					};
				}
				return null;
			}

			if (!state.schemaPath) return null;
			if (!isEnvModuleId(id, state.schemaPath)) return null;

			return {
				code: generateClientEnvModule(state.clientValues, state.serverKeys),
				map: null,
			};
		},
		handleHotUpdate({ file, server }) {
			const isStrict = state.resolvedLayout === "strict" && state.baseDir;
			const schemaChanged = isStrict
				? file.startsWith(state.baseDir as string)
				: Boolean(state.schemaPath && isEnvModuleId(file, state.schemaPath));
			const envFileChanged = isDotEnvFile(file);
			if (!schemaChanged && !envFileChanged) return;

			try {
				refreshTransformState();
			} catch (error: unknown) {
				buildLog.logBuildErrorWithCause(
					"Environment validation failed during HMR",
					error,
				);
				throw error;
			}

			const targetPath = isStrict ? state.clientPath : state.schemaPath;
			if (!targetPath) return;

			const modules = [
				...(server.moduleGraph.getModulesByFile(targetPath) ?? []),
			];
			for (const mod of modules) {
				server.moduleGraph.invalidateModule(mod);
			}
			return modules;
		},
	};
}
