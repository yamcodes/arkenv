import fs from "node:fs";
import path from "node:path";
import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
import { defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { formatBuildError } from "@repo/utils";
import { name, peerDependencies, version } from "../package.json";

export type ModuleOptions = {
	schemaPath?: string;
	layout?: "simple" | "strict";
};

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
	meta: {
		name,
		version,
		configKey: "arkenv",
		compatibility: {
			nuxt: peerDependencies?.nuxt,
		},
	},
	defaults: {},
	setup(options, nuxt) {
		const schemaPath = options.schemaPath
			? path.resolve(nuxt.options.rootDir, options.schemaPath)
			: findSchemaPath(nuxt.options.rootDir);

		if (!schemaPath || !fs.existsSync(schemaPath)) {
			return;
		}

		const { layout: resolvedLayout, baseDir } = resolveLayout(
			schemaPath,
			options.layout,
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
					resolveId(id: string) {
						const isServerModule =
							id === "@arkenv/nuxt/server" ||
							id === "@arkenv/nuxt/standard/server" ||
							/[/\\]@arkenv[/\\]nuxt[/\\](?:src|dist)[/\\](?:standard[/\\])?server(?:\.(?:js|mjs|cjs|ts))?$/.test(
								id,
							);

						if (isServerModule) {
							throw new Error(
								formatBuildError(
									"Importing server-only environment schema on the client is not allowed!",
								),
							);
						}
					},
				});
			}
		});
	},
});

export default module;
