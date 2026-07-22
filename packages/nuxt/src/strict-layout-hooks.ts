import fs from "node:fs";
import path from "node:path";
import type { Nuxt } from "@nuxt/schema";
import {
	CLIENT_ENV_SPECIFIER,
	UNRESOLVED_CLIENT_ENV_ERROR,
} from "./strict-client-env";
import {
	SHARED_SCHEMA_SPECIFIER,
	UNRESOLVED_SHARED_SCHEMA_ERROR,
} from "./strict-shared-schema";

type NitroConfigHook = {
	alias?: Record<string, string>;
	replace?: Record<string, string>;
};

declare module "@nuxt/schema" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation requires an interface for declaration merging
	interface NuxtHooks {
		"nitro:config": (nitroConfig: NitroConfigHook) => void;
	}
}

/**
 * Register TypeScript path and Nitro alias/define wiring for strict-layout
 * `#arkenv/client-env` and `#arkenv/shared-schema` auto-extend.
 *
 * @param nuxt The Nuxt instance
 * @param strictClientPath Absolute path to the project's `env/client.ts`
 * @param strictSharedPath Absolute path to the project's `env/internal/shared.ts`
 */
export function registerStrictLayoutHooks(
	nuxt: Nuxt,
	strictClientPath: string,
	strictSharedPath: string,
): void {
	nuxt.options.alias = nuxt.options.alias || {};
	nuxt.options.alias[CLIENT_ENV_SPECIFIER] = strictClientPath;
	nuxt.options.alias[SHARED_SCHEMA_SPECIFIER] = strictSharedPath;

	// Mirror the runtime aliases into generated tsconfig paths so AutoClientEnv /
	// AutoSharedSchema resolve to project files (not the empty package fallbacks).
	nuxt.hook("prepare:types", ({ tsConfig }) => {
		tsConfig.compilerOptions ??= {};
		tsConfig.compilerOptions.paths ??= {};
		tsConfig.compilerOptions.paths[CLIENT_ENV_SPECIFIER] = [strictClientPath];
		tsConfig.compilerOptions.paths[SHARED_SCHEMA_SPECIFIER] = [
			strictSharedPath,
		];
	});

	// Nitro uses its own bundler; Vite alias/define alone does not cover
	// server/api routes that import ~~/env/server.
	nuxt.hook("nitro:config", (nitroConfig) => {
		nitroConfig.alias ??= {};
		nitroConfig.alias[CLIENT_ENV_SPECIFIER] = strictClientPath;
		nitroConfig.alias[SHARED_SCHEMA_SPECIFIER] = strictSharedPath;
		nitroConfig.replace ??= {};
		nitroConfig.replace.__ARKENV_STRICT_LAYOUT__ = JSON.stringify(true);
	});
}

type ViteExtendContext = {
	resolvedLayout: "simple" | "strict";
	baseDir: string | undefined;
	strictClientPath: string | undefined;
	strictSharedPath: string | undefined;
	rootDir: string;
	srcDir: string;
	clientSecurityError: string;
};

/**
 * Resolve common Nuxt path aliases to absolute paths.
 *
 * @param id The module id as seen by Vite's resolveId hook
 * @param rootDir The Nuxt project root directory
 * @param srcDir The resolved Nuxt source directory
 * @returns The absolute path the alias resolves to, or the original id if not a recognized alias
 */
function resolveNuxtAlias(id: string, rootDir: string, srcDir: string): string {
	if (path.isAbsolute(id)) return id;

	if (id.startsWith("~~/")) {
		return path.resolve(rootDir, id.slice(3));
	}

	if (id.startsWith("~/") || id.startsWith("@/")) {
		return path.resolve(srcDir, id.slice(2));
	}

	return id;
}

/**
 * Register the Vite `extendConfig` hook that wires `#arkenv/client-env` /
 * `#arkenv/shared-schema` and blocks client imports of server-only schemas.
 *
 * @param nuxt The Nuxt instance
 * @param context Layout paths and security error message
 */
export function registerViteExtendHook(
	nuxt: Nuxt,
	context: ViteExtendContext,
): void {
	const {
		resolvedLayout,
		baseDir,
		strictClientPath,
		strictSharedPath,
		rootDir,
		srcDir,
		clientSecurityError,
	} = context;

	nuxt.hook("vite:extendConfig", (config, { isClient }) => {
		// biome-ignore lint/suspicious/noExplicitAny: Nuxt's Vite config type is overly restrictive
		const anyConfig = config as any;
		anyConfig.plugins = anyConfig.plugins || [];

		if (resolvedLayout === "strict" && strictClientPath && strictSharedPath) {
			anyConfig.define = {
				...anyConfig.define,
				__ARKENV_STRICT_LAYOUT__: JSON.stringify(true),
			};

			anyConfig.resolve = anyConfig.resolve || {};
			anyConfig.resolve.alias = anyConfig.resolve.alias || {};
			if (Array.isArray(anyConfig.resolve.alias)) {
				anyConfig.resolve.alias.push(
					{
						find: CLIENT_ENV_SPECIFIER,
						replacement: strictClientPath,
					},
					{
						find: SHARED_SCHEMA_SPECIFIER,
						replacement: strictSharedPath,
					},
				);
			} else {
				anyConfig.resolve.alias[CLIENT_ENV_SPECIFIER] = strictClientPath;
				anyConfig.resolve.alias[SHARED_SCHEMA_SPECIFIER] = strictSharedPath;
			}

			anyConfig.plugins.push({
				name: "arkenv-nuxt-client-env",
				resolveId(id: string) {
					if (
						id === CLIENT_ENV_SPECIFIER ||
						id === `\0${CLIENT_ENV_SPECIFIER}`
					) {
						if (strictClientPath && fs.existsSync(strictClientPath)) {
							return strictClientPath;
						}
						throw new Error(UNRESOLVED_CLIENT_ENV_ERROR);
					}
				},
			});

			anyConfig.plugins.push({
				name: "arkenv-nuxt-shared-schema",
				resolveId(id: string) {
					if (
						id === SHARED_SCHEMA_SPECIFIER ||
						id === `\0${SHARED_SCHEMA_SPECIFIER}`
					) {
						if (strictSharedPath && fs.existsSync(strictSharedPath)) {
							return strictSharedPath;
						}
						throw new Error(UNRESOLVED_SHARED_SCHEMA_ERROR);
					}
				},
			});
		}

		if (isClient) {
			anyConfig.plugins.push({
				name: "arkenv-nuxt-client-security",
				resolveId(id: string, importer?: string) {
					const isServerModule =
						id === "@arkenv/nuxt/server" ||
						id === "@arkenv/nuxt/standard/server" ||
						/[/\\]@arkenv[/\\]nuxt[/\\](?:src|dist)[/\\](?:standard[/\\])?server(?:\.(?:js|mjs|cjs|ts))?$/.test(
							id,
						);

					if (isServerModule) {
						throw new Error(clientSecurityError);
					}

					if (resolvedLayout === "strict" && baseDir) {
						let targetId = id;
						if (id.startsWith(".") && importer) {
							targetId = path.resolve(path.dirname(importer), id);
						}

						const resolvedId = resolveNuxtAlias(targetId, rootDir, srcDir);

						if (path.isAbsolute(resolvedId)) {
							const relativePath = path.relative(baseDir, resolvedId);
							const isUnderBaseDir =
								!relativePath.startsWith("..") &&
								!path.isAbsolute(relativePath);
							const isServerFile = /(^|[/\\])server(?:[/\\]|\.[^./\\]*|$)/.test(
								relativePath,
							);

							if (isUnderBaseDir && isServerFile) {
								throw new Error(clientSecurityError);
							}
						}
					}
				},
			});
		}
	});
}
