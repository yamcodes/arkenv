import fs from "node:fs";
import path from "node:path";
import { addServerPlugin, createResolver, defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { formatBuildError } from "@repo/log";
import { name, peerDependencies, version } from "../package.json";
import type { BootGateEngine } from "./boot-gate";
import { createBundledSchemaVirtualModules } from "./bundled-schema";
import {
	type ArkEnvConfigOptions,
	extractKeys,
	findSchemaPath,
	formatMissingSchemaError,
	validateSchema,
} from "./config";
import { getDefaultBootGateEngine } from "./module-engine";
import {
	arkenvSchemaCapturePlugin,
	toCaptureModuleId,
} from "./schema-capture-plugin";

/**
 * Configuration options for the ArkEnv Nuxt module.
 *
 * Provide these under the `arkenv` key in your `nuxt.config.ts`.
 *
 * @example
 * ```ts
 * export default defineNuxtConfig({
 *   modules: ["@arkenv/nuxt/module"],
 *   arkenv: {
 *     schemaPath: "src/env.ts"
 *   }
 * });
 * ```
 */
export type ModuleOptions = ArkEnvConfigOptions;

declare module "@nuxt/schema" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtConfig {
		arkenv?: ModuleOptions;
	}
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtOptions {
		arkenv?: ModuleOptions;
	}
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
	meta: {
		name,
		version,
		configKey: "arkenv",
		compatibility: {
			nuxt: peerDependencies?.nuxt,
		},
	},
	defaults: {
		validate: true,
	},
	setup(options, nuxt) {
		const schemaPath = options.schemaPath
			? path.resolve(nuxt.options.rootDir, options.schemaPath)
			: findSchemaPath(nuxt.options.rootDir);

		if (!schemaPath || !fs.existsSync(schemaPath)) {
			throw new Error(
				formatMissingSchemaError({
					schemaPath: options.schemaPath,
					optionsHint: "ArkEnv options",
				}),
			);
		}

		const resolver = createResolver(import.meta.url);
		const engine: BootGateEngine = getDefaultBootGateEngine();

		const emptyServerBoot = resolver.resolve("./empty-server-boot");
		const realServerBoot = resolver.resolve("./server-boot");

		// Default to the empty stub; Vite SSR + Nitro overwrite with the real gate.
		nuxt.options.alias = nuxt.options.alias || {};
		nuxt.options.alias["#arkenv/server-boot"] = emptyServerBoot;

		nuxt.hook("vite:extendConfig", (config, { isClient }) => {
			// biome-ignore lint/suspicious/noExplicitAny: Nuxt's Vite config type is overly restrictive
			const anyConfig = config as any;
			anyConfig.resolve = anyConfig.resolve || {};
			anyConfig.resolve.alias = anyConfig.resolve.alias || {};
			const aliasTarget = isClient ? emptyServerBoot : realServerBoot;
			if (Array.isArray(anyConfig.resolve.alias)) {
				anyConfig.resolve.alias.push({
					find: "#arkenv/server-boot",
					replacement: aliasTarget,
				});
			} else {
				anyConfig.resolve.alias["#arkenv/server-boot"] = aliasTarget;
			}
		});

		const bootPlugin = resolver.resolve("./runtime/nitro-boot-plugin");
		const captureRuntimePath = resolveEmittedModule(
			resolver.resolve("./bundled-schema"),
		);

		nuxt.hook("nitro:config", (nitroConfig) => {
			// Nuxt 4.6 types this hook as NitroConfig, which stays NitroConfigFallback
			// (no `alias`) until a server builder registers. Nitro still accepts these fields.
			const config = nitroConfig as typeof nitroConfig & {
				alias?: Record<string, string>;
				rollupConfig?: { plugins?: unknown[] };
				externals?: { traceInclude?: string[] };
			};
			config.alias = config.alias || {};
			config.alias["#arkenv/server-boot"] = realServerBoot;

			const aliases: Record<string, string> = {};
			for (const [key, value] of Object.entries(nuxt.options.alias || {})) {
				if (typeof value === "string") aliases[key] = value;
			}
			for (const [key, value] of Object.entries(config.alias)) {
				if (typeof value === "string") aliases[key] = value;
			}

			config.virtual = config.virtual || {};
			Object.assign(
				config.virtual,
				createBundledSchemaVirtualModules({
					engine,
					captureRuntimePath,
					captureModuleId: toCaptureModuleId(schemaPath),
				}),
			);

			config.rollupConfig = config.rollupConfig || {};
			const rollupPlugins = Array.isArray(config.rollupConfig.plugins)
				? config.rollupConfig.plugins
				: [];
			const hasCapturePlugin = rollupPlugins.some(
				(plugin) =>
					typeof plugin === "object" &&
					plugin !== null &&
					"name" in plugin &&
					(plugin as { name?: string }).name === "arkenv-schema-capture",
			);
			if (!hasCapturePlugin) {
				rollupPlugins.push(
					arkenvSchemaCapturePlugin({
						aliases,
						rootDir: nuxt.options.rootDir,
					}),
				);
			}
			config.rollupConfig.plugins = rollupPlugins;

			const enginePackage =
				engine === "standard" ? "@arkenv/standard" : "@arkenv/core";
			config.externals = config.externals || {};
			const traceInclude = config.externals.traceInclude ?? [];
			if (!traceInclude.includes(enginePackage)) {
				config.externals.traceInclude = [...traceInclude, enginePackage];
			}

			config.plugins = config.plugins || [];
			config.plugins = config.plugins.filter((plugin) => !isBootPlugin(plugin));
			config.plugins.unshift(bootPlugin);
		});

		if (nuxt.options.dev) {
			nuxt.options.watch = nuxt.options.watch || [];
			nuxt.options.watch.push(schemaPath);
		}

		const validate = options.validate ?? true;

		if (validate) {
			try {
				validateSchema(schemaPath, {
					engine,
				});
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				throw new Error(
					formatBuildError(`Environment validation failed: ${message}`),
				);
			}
		}

		const fileContent = fs.readFileSync(schemaPath, "utf-8");
		const extracted = extractKeys(fileContent);
		const serverKeys = extracted.serverKeys;
		const clientKeys = extracted.clientKeys;
		const sharedKeys = extracted.sharedKeys;

		nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {};
		nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {};

		for (const key of serverKeys) {
			if (nuxt.options.runtimeConfig[key] === undefined) {
				nuxt.options.runtimeConfig[key] = nuxt.options.dev
					? process.env[key] || ""
					: "";
			}
		}

		for (const key of [...clientKeys, ...sharedKeys]) {
			if (nuxt.options.runtimeConfig.public[key] === undefined) {
				nuxt.options.runtimeConfig.public[key] = process.env[key] || "";
			}
		}

		(nuxt.options.runtimeConfig as { arkenvGate?: unknown }).arkenvGate = {
			engine,
		};

		addServerPlugin(bootPlugin);
	},
});

/**
 * Resolve a module path to the source or compiled file Nitro should bundle.
 *
 * @param basePath Resolver path without an extension
 * @returns Absolute path of the existing file
 */
function resolveEmittedModule(basePath: string): string {
	const candidates = [
		basePath,
		`${basePath}.ts`,
		`${basePath}.mjs`,
		`${basePath}.js`,
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return `${basePath}.js`;
}

/**
 * Report whether a Nitro plugin path is the ArkEnv boot plugin.
 *
 * @param plugin Plugin path registered on the Nitro config
 * @returns `true` when the path points at the boot plugin
 */
function isBootPlugin(plugin: string): boolean {
	return plugin.replace(/\\/g, "/").includes("/runtime/nitro-boot-plugin");
}

export default module;
