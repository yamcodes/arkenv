import fs from "node:fs";
import path from "node:path";
import { addServerPlugin, createResolver, defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { formatBuildError, resolveBuildLog } from "@repo/log";
import { name, peerDependencies, version } from "../package.json";
import type { BootGateEngine } from "./boot-gate";
import {
	type ArkEnvConfigOptions,
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	findSchemaPath,
	normalizeLayout,
	resolveLayout,
	validateSchema,
} from "./config";
import { getDefaultBootGateEngine } from "./module-engine";
import { missingClientTsError } from "./strict-client-env";
import {
	registerStrictLayoutHooks,
	registerViteExtendHook,
} from "./strict-layout-hooks";
import { missingSharedTsError } from "./strict-shared-schema";

/**
 * Configuration options for the ArkEnv Nuxt module.
 *
 * Provide these under the `arkenv` key in your `nuxt.config.ts`.
 *
 * Aliased to {@link ArkEnvConfigOptions} so the documented options remain the
 * single source of truth (field-level JSDoc, `@default` tags, and so on).
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

const CLIENT_SECURITY_ERROR = formatBuildError(
	"Importing server-only environment schema on the client is not allowed!",
);

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
		const buildLog = resolveBuildLog(options);

		const schemaPath = options.schemaPath
			? path.resolve(nuxt.options.rootDir, options.schemaPath)
			: findSchemaPath(nuxt.options.rootDir);

		if (!schemaPath || !fs.existsSync(schemaPath)) {
			throw new Error(
				`[ArkEnv] Could not find schema file at ${
					options.schemaPath || "src/env.ts or env.ts"
				}. Please specify 'schemaPath' in ArkEnv options (or run \`arkenv init\`).`,
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

		const normalizedLayout = normalizeLayout(options.layout, buildLog);

		const { layout: resolvedLayout, baseDir } = resolveLayout(
			schemaPath,
			normalizedLayout,
		);

		const srcDir = path.resolve(
			nuxt.options.rootDir,
			nuxt.options.srcDir ?? nuxt.options.rootDir,
		);

		let strictClientPath: string | undefined;
		let strictSharedPath: string | undefined;
		if (resolvedLayout === "strict" && baseDir) {
			const clientPath = path.join(baseDir, "client.ts");
			if (!fs.existsSync(clientPath)) {
				throw new Error(missingClientTsError(clientPath, baseDir));
			}
			const sharedPath = path.join(baseDir, "internal", "shared.ts");
			if (!fs.existsSync(sharedPath)) {
				throw new Error(missingSharedTsError(sharedPath, baseDir));
			}
			strictClientPath = clientPath;
			strictSharedPath = sharedPath;
		}

		if (nuxt.options.dev) {
			const watchPaths =
				resolvedLayout === "strict" && baseDir
					? [
							path.join(baseDir, "internal", "shared.ts"),
							path.join(baseDir, "client.ts"),
							path.join(baseDir, "server.ts"),
						].filter(fs.existsSync)
					: [schemaPath];

			nuxt.options.watch = nuxt.options.watch || [];
			for (const p of watchPaths) {
				nuxt.options.watch.push(p);
			}
		}

		const validate = options.validate ?? true;

		if (validate) {
			try {
				validateSchema(schemaPath, resolvedLayout, baseDir ?? "", {
					engine,
				});
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				throw new Error(
					formatBuildError(`Environment validation failed: ${message}`),
				);
			}
		}

		let serverKeys: string[] = [];
		let clientKeys: string[] = [];
		let sharedKeys: string[] = [];

		if (
			resolvedLayout === "strict" &&
			baseDir &&
			strictClientPath &&
			strictSharedPath
		) {
			const serverPath = path.join(baseDir, "server.ts");

			const clientContent = fs.readFileSync(strictClientPath, "utf-8");
			const sharedContent = fs.readFileSync(strictSharedPath, "utf-8");
			const serverContent = fs.existsSync(serverPath)
				? fs.readFileSync(serverPath, "utf-8")
				: "";

			clientKeys = extractClientKeys(clientContent);
			sharedKeys = extractSharedKeys(sharedContent);
			serverKeys = extractServerKeys(serverContent);

			registerStrictLayoutHooks(nuxt, strictClientPath, strictSharedPath);
		} else {
			const fileContent = fs.readFileSync(schemaPath, "utf-8");
			const extracted = extractKeys(fileContent);
			serverKeys = extracted.serverKeys;
			clientKeys = extracted.clientKeys;
			sharedKeys = extracted.sharedKeys;
		}

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
			layout: resolvedLayout,
			baseDir: baseDir ?? "",
			engine,
		};

		addServerPlugin(resolver.resolve("./runtime/nitro-boot-plugin"));

		registerViteExtendHook(nuxt, {
			resolvedLayout,
			baseDir,
			strictClientPath,
			strictSharedPath,
			rootDir: nuxt.options.rootDir,
			srcDir,
			clientSecurityError: CLIENT_SECURITY_ERROR,
		});
	},
});

export default module;
