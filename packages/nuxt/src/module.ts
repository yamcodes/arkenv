import fs from "node:fs";
import path from "node:path";
import { defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
	runCodegen,
	watchSchema,
} from "./config";

export interface ModuleOptions {
	schemaPath?: string;
	outputPath?: string;
	layout?: "simple" | "strict";
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
	meta: {
		name: "@arkenv/nuxt",
		configKey: "arkenv",
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

		const defaultOutputDir =
			resolvedLayout === "strict" && baseDir
				? baseDir
				: path.dirname(schemaPath);
		const defaultOutputPath = path.join(
			defaultOutputDir,
			"generated",
			"env.gen.ts",
		);
		const outputPath = options.outputPath
			? path.resolve(nuxt.options.rootDir, options.outputPath)
			: defaultOutputPath;

		// 1. Initial codegen
		try {
			runCodegen(schemaPath, outputPath, resolvedLayout);
		} catch (error) {
			console.error(`[ArkEnv] Failed to generate env.gen.ts: ${error}`);
		}

		// 2. Watcher in dev mode
		if (nuxt.options.dev) {
			const watchPaths =
				resolvedLayout === "strict" && baseDir
					? [
							path.join(baseDir, "internal", "shared.ts"),
							path.join(baseDir, "client.ts"),
							path.join(baseDir, "server.ts"),
						].filter(fs.existsSync)
					: [schemaPath];
			watchSchema(watchPaths, outputPath, resolvedLayout);
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
				config.plugins = config.plugins || [];
				config.plugins.push({
					name: "arkenv-nuxt-client-security",
					resolveId(id) {
						if (
							id === "@arkenv/nuxt/server" ||
							id.endsWith("/packages/nuxt/dist/server.js") ||
							id.endsWith("/packages/nuxt/dist/server.cjs")
						) {
							throw new Error(
								"[ArkEnv] Importing server-only environment schema on the client is not allowed!",
							);
						}
					},
				});
			}
		});
	},
});

export default module;
