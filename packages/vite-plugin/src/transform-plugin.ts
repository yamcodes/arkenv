import fs from "node:fs";
import {
	classifyEnvKeys,
	generateClientEnvModule,
	isDotEnvFile,
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
import { loadEnv, type Plugin } from "vite";
import type { VitePluginFactoryConfig } from "./plugin-config";

/**
 * Build the env-module transform plugin (client rewrite + SSR passthrough).
 *
 * @param pluginName The Vite plugin name
 * @param transformOptions Plugin options including `schemaPath` / `clientPrefix`
 * @param factoryLogOptions Default logging options from the factory
 * @returns A Vite plugin that rewrites `env.ts` in the client graph
 */
export function createTransformPlugin(
	pluginName: string,
	transformOptions: VitePluginFactoryConfig,
	factoryLogOptions?: ArkEnvLogOptions,
): Plugin {
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
		if (!state.schemaPath || !fs.existsSync(state.schemaPath)) return;

		const loaded = {
			...loadEnv(state.mode, state.envDir, ""),
			...(pluginConfig.env as Record<string, string | undefined> | undefined),
		};

		const validated = loadValidatedEnv(state.schemaPath, loaded, {
			prefix: "ArkEnv Vite plugin:",
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
				state.schemaPath = resolveEnvModulePath(
					resolved.root,
					schemaPathOption,
					"ArkEnv Vite plugin:",
				);
				refreshTransformState();
			} catch (error: unknown) {
				buildLog.logBuildErrorWithCause("Environment validation failed", error);
				throw error;
			}
		},
		/**
		 * Rewrite the env module in the client graph only.
		 *
		 * @remarks
		 * Vite 6+ discriminates module graphs through the Environment API:
		 * server consumers (or environments named `ssr`) keep the real module,
		 * everything else gets the client rewrite. On Vite 4/5, where
		 * `this.environment` is undefined, the legacy `options.ssr` flag is used
		 * as a fallback.
		 *
		 * ADR 0021 (canonical env object surface): do not reintroduce `env.gen.ts`
		 * codegen, client-side re-validation, or `runtimeEnv` wiring here.
		 */
		transform(_code, id, options) {
			const isServer = this.environment
				? this.environment.config?.consumer === "server" ||
					this.environment.name === "ssr"
				: Boolean(options?.ssr);

			if (isServer) return null;
			if (!state.schemaPath) return null;
			if (!isEnvModuleId(id, state.schemaPath)) return null;

			return {
				code: generateClientEnvModule(state.clientValues, state.serverKeys),
				map: null,
			};
		},
		handleHotUpdate({ file, server }) {
			const schemaChanged = Boolean(
				state.schemaPath && isEnvModuleId(file, state.schemaPath),
			);
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

			if (!state.schemaPath) return;

			const modules = [
				...(server.moduleGraph.getModulesByFile(state.schemaPath) ?? []),
			];
			for (const mod of modules) {
				server.moduleGraph.invalidateModule(mod);
			}
			return modules;
		},
	};
}
