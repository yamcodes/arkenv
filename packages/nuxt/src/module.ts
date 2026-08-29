import fs from "node:fs";
import path from "node:path";
import { addServerPlugin, createResolver, defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { formatBuildError } from "@repo/log";
import { name, peerDependencies, version } from "../package.json";
import type { BootGateEngine } from "./boot-gate";
import {
	type ArkEnvConfigOptions,
	extractKeys,
	findSchemaPath,
	formatMissingSchemaError,
	validateSchema,
} from "./config";
import { getDefaultBootGateEngine } from "./module-engine";

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

type NitroConfigHook = {
	alias?: Record<string, string>;
};

declare module "@nuxt/schema" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtConfig {
		arkenv?: ModuleOptions;
	}
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtOptions {
		arkenv?: ModuleOptions;
	}
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtHooks {
		"nitro:config": (nitroConfig: NitroConfigHook) => void;
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

		nuxt.hook("nitro:config", (nitroConfig) => {
			nitroConfig.alias = nitroConfig.alias || {};
			nitroConfig.alias["#arkenv/server-boot"] = realServerBoot;
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
			schemaPath,
			engine,
		};

		addServerPlugin(resolver.resolve("./runtime/nitro-boot-plugin"));
	},
});

export default module;
