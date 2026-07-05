import fs from "node:fs";
import path from "node:path";
import { defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { name, peerDependencies, version } from "../package.json";
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

export type ModuleOptions = {
	schemaPath?: string;
	layout?: ArkEnvConfigOptions["layout"];
	validate?: boolean;
};

const CLIENT_SECURITY_ERROR =
	"[ArkEnv] Importing server-only environment schema on the client is not allowed!";

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
			return;
		}

		const normalizedLayout = normalizeLayout(options.layout);

		const { layout: resolvedLayout, baseDir } = resolveLayout(
			schemaPath,
			normalizedLayout,
		);

		const srcDir = path.resolve(
			nuxt.options.rootDir,
			nuxt.options.srcDir ?? nuxt.options.rootDir,
		);

		// Register schema paths to watch so Nuxt restarts and updates runtimeConfig when they change
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

		// Run validation via the shared config helpers
		const validate = options.validate ?? true;

		if (validate) {
			try {
				validateSchema(schemaPath, resolvedLayout, baseDir ?? "");
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				throw new Error(`[ArkEnv] Environment validation failed: ${message}`);
			}
		}

		// 3. Register env keys to runtimeConfig
		let serverKeys: string[] = [];
		let clientKeys: string[] = [];
		let sharedKeys: string[] = [];

		if (resolvedLayout === "strict" && baseDir) {
			const clientPath = path.join(baseDir, "client.ts");
			const sharedPath = path.join(baseDir, "internal", "shared.ts");
			const serverPath = path.join(baseDir, "server.ts");

			const clientContent = fs.existsSync(clientPath)
				? fs.readFileSync(clientPath, "utf-8")
				: "";
			const sharedContent = fs.existsSync(sharedPath)
				? fs.readFileSync(sharedPath, "utf-8")
				: "";
			const serverContent = fs.existsSync(serverPath)
				? fs.readFileSync(serverPath, "utf-8")
				: "";

			clientKeys = extractClientKeys(clientContent);
			sharedKeys = extractSharedKeys(sharedContent);
			serverKeys = extractServerKeys(serverContent);
		} else {
			const fileContent = fs.readFileSync(schemaPath, "utf-8");
			const extracted = extractKeys(fileContent);
			serverKeys = extracted.serverKeys;
			clientKeys = extracted.clientKeys;
			sharedKeys = extracted.sharedKeys;
		}

		nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {};
		nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {};

		// Server keys (private)
		for (const key of serverKeys) {
			if (nuxt.options.runtimeConfig[key] === undefined) {
				nuxt.options.runtimeConfig[key] = process.env[key] || "";
			}
		}

		// Client & Shared keys (public)
		for (const key of [...clientKeys, ...sharedKeys]) {
			if (nuxt.options.runtimeConfig.public[key] === undefined) {
				nuxt.options.runtimeConfig.public[key] = process.env[key] || "";
			}
		}

		// 4. Vite extendConfig to block server-only imports on client side
		nuxt.hook("vite:extendConfig", (config, { isClient }) => {
			if (isClient) {
				// biome-ignore lint/suspicious/noExplicitAny: bypassed because Nuxt's Vite config type is overly restrictive
				const anyConfig = config as any;
				anyConfig.plugins = anyConfig.plugins || [];
				anyConfig.plugins.push({
					name: "arkenv-nuxt-client-security",
					resolveId(id: string, importer?: string) {
						const isServerModule =
							id === "@arkenv/nuxt/server" ||
							/[/\\]@arkenv[/\\]nuxt[/\\](?:src|dist)[/\\]server(?:\.(?:js|mjs|cjs|ts))?$/.test(
								id,
							);

						if (isServerModule) {
							throw new Error(CLIENT_SECURITY_ERROR);
						}

						if (resolvedLayout === "strict" && baseDir) {
							let targetId = id;
							if (id.startsWith(".") && importer) {
								targetId = path.resolve(path.dirname(importer), id);
							}

							const resolvedId = resolveNuxtAlias(
								targetId,
								nuxt.options.rootDir,
								srcDir,
							);

							if (path.isAbsolute(resolvedId)) {
								const relativePath = path.relative(baseDir, resolvedId);
								const isUnderBaseDir =
									!relativePath.startsWith("..") &&
									!path.isAbsolute(relativePath);
								const isServerFile = /(^|[/\\])server(?:\.[^./\\]*)?$/.test(
									relativePath,
								);

								if (isUnderBaseDir && isServerFile) {
									throw new Error(CLIENT_SECURITY_ERROR);
								}
							}
						}
					},
				});
			}
		});
	},
});

export default module;
