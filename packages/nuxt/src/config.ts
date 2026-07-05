import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	extractKeys as coreExtractKeys,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
import { createJiti } from "jiti";

export type { LayoutMode, Logger, ResolvedLayout } from "@arkenv/build";
export {
	extractArkenvBlock,
	extractServerKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
export { extractClientKeys, extractSharedKeys };

let hasWarnedSimpleLayout = false;

export function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			// biome-ignore lint/suspicious/noConsole: deprecation warning
			console.warn(
				"⚠️ [arkenv] The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
			);
		}
		return "simple";
	}
	if (layout === "flat") {
		return "simple";
	}
	return layout;
}

/**
 * Configuration options for the ArkEnv Nuxt module integration.
 *
 * @example
 * ```ts
 * const configOptions: ArkEnvConfigOptions = {
 *   schemaPath: "./src/env.ts",
 * };
 * ```
 */
export type ArkEnvConfigOptions = {
	/**
	 * Specify the path to the schema definition file.
	 *
	 * Defaults to searching for `"src/env.ts"` or `"env.ts"` in the project root.
	 *
	 * @default "src/env.ts"
	 * @example
	 * ```ts
	 * export default defineNuxtConfig({
	 *   modules: ["@arkenv/nuxt/module"],
	 *   arkenv: { schemaPath: "./env.ts" }
	 * });
	 * ```
	 */
	schemaPath?: string;

	/**
	 * Specify the configuration layout.
	 *
	 * - `"flat"` (default): A single `env.ts` schema file.
	 * - `"strict"`: A 3-file split schema layout (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`).
	 *
	 * @default "flat"
	 */
	layout?:
		| "flat"
		| "strict"
		/** @deprecated Use `"flat"` instead. `"simple"` will be removed in the next major version. */
		| "simple";

	/**
	 * Enable or disable build-time environment variable validation during build/dev startup.
	 *
	 * @default true
	 */
	validate?: boolean;
};

/**
 * Run ArkEnv validation without a full Nuxt module lifecycle.
 *
 * @param options Optional configuration paths for schema and output files
 * @param internalOptions Optional configuration for internal testing hooks
 * @throws An error if the schema file cannot be found or if validation fails
 */
export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	// 1. Locate the env.ts schema file or strict schema directory
	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

	// Auto-detect layout if not specified
	let exists = false;
	if (schemaPath) {
		if (fs.existsSync(schemaPath)) {
			exists = true;
		} else {
			const ext = path.extname(schemaPath);
			if (ext) {
				const baseWithoutExt = schemaPath.slice(0, -ext.length);
				if (fs.existsSync(baseWithoutExt)) {
					exists = true;
				}
			}
		}
	}

	if (!schemaPath || !exists) {
		throw new Error(
			`[ArkEnv] Could not find schema file at ${
				options?.schemaPath || "src/env.ts or env.ts"
			}. Please specify 'schemaPath' in ArkEnv options.`,
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	// 2. Validate schema against environment variables
	const runValidation = options?.validate ?? true;
	if (runValidation) {
		try {
			validateSchema(schemaPath, resolvedLayout, baseDir, internalOptions);
		} catch (error: unknown) {
			console.error("\n❌ [ArkEnv] Environment validation failed:");
			console.error(error instanceof Error ? error.message : String(error));
			console.error("");
			throw error;
		}
	}
}

/**
 * Validate the resolved schema against the current process environment.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param resolvedLayout The resolved layout mode
 * @param baseDir The strict layout base directory, when applicable
 * @param internalOptions Optional configuration for internal testing hooks
 * @throws An error if a required environment variable is missing or invalid
 */
export function validateSchema(
	schemaPath: string,
	resolvedLayout: "simple" | "strict",
	baseDir: string,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	try {
		const g = globalThis as any;
		g.__arkenv_force_server_count__ =
			(g.__arkenv_force_server_count__ || 0) + 1;
		g.__arkenv_force_server__ = true;
		const fileToEvaluate =
			resolvedLayout === "strict" && baseDir
				? path.join(baseDir, "server.ts")
				: schemaPath;

		const filenameForJiti =
			typeof __filename !== "undefined"
				? __filename
				: typeof import.meta !== "undefined" && import.meta.url
					? fileURLToPath(import.meta.url)
					: "";
		const dir = path.dirname(filenameForJiti);

		const packageJsonPath = path.resolve(dir, "../package.json");
		let pkgExports: Record<string, any> = {};
		try {
			const pkgContent = fs.readFileSync(packageJsonPath, "utf-8");
			pkgExports = JSON.parse(pkgContent).exports || {};
		} catch {
			// fallback if package.json isn't adjacent/found
		}

		// Helper to resolve the correct local path for a given export subpath
		const resolveExportPath = (
			subpath: string,
			fallbackFile: string,
		): string => {
			const entry = pkgExports[subpath];
			if (entry) {
				// Prioritize modern import mapping
				const target = entry.import || entry.default || entry;
				if (typeof target === "string") {
					// Map built dist path (e.g. ./dist/shared.js) back to source (e.g. ./src/shared.ts)
					// or resolve it directly if the source is already mapped.
					const fileBasename = path.basename(target).replace(/\.m?[jt]s$/, "");
					// Look in the same directory first
					const tsPath = path.join(dir, `${fileBasename}.ts`);
					if (fs.existsSync(tsPath)) {
						return tsPath;
					}
					const jsPath = path.join(dir, `${fileBasename}.js`);
					if (fs.existsSync(jsPath)) {
						return jsPath;
					}
				}
			}
			return fallbackFile;
		};

		const sharedPath = resolveExportPath(
			"./shared",
			fs.existsSync(path.join(dir, "shared.ts"))
				? path.join(dir, "shared.ts")
				: path.join(dir, "shared.js"),
		);
		const indexPath = resolveExportPath(
			".",
			fs.existsSync(path.join(dir, "index.ts"))
				? path.join(dir, "index.ts")
				: path.join(dir, "index.js"),
		);
		const clientPath = resolveExportPath(
			"./client",
			fs.existsSync(path.join(dir, "client.ts"))
				? path.join(dir, "client.ts")
				: path.join(dir, "client.js"),
		);
		const serverPath = resolveExportPath(
			"./server",
			fs.existsSync(path.join(dir, "server.ts"))
				? path.join(dir, "server.ts")
				: path.join(dir, "server.js"),
		);

		const mockImportsPath = fs.existsSync(path.join(dir, "mock-imports.ts"))
			? path.join(dir, "mock-imports.ts")
			: fs.existsSync(path.join(dir, "mock-imports.js"))
				? path.join(dir, "mock-imports.js")
				: path.join(dir, "mock-imports.cjs");

		const aliases: Record<string, string> = {
			"@arkenv/nuxt/shared": sharedPath,
			"@arkenv/nuxt": indexPath,
			"@arkenv/nuxt/client": clientPath,
			"@arkenv/nuxt/server": serverPath,
			"#imports": mockImportsPath,
			...internalOptions?._jitiAliases,
		};

		const jitiOptions = {
			moduleCache: false,
			fsCache: false,
			tsconfigPaths: true,
			alias: aliases,
		} as const;

		try {
			const jiti = createJiti(fileToEvaluate, jitiOptions);
			jiti(fileToEvaluate);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const isTsconfigNotFound =
				error instanceof Error &&
				/tsconfig/i.test(message) &&
				(/not found/i.test(message) || (error as any).code === "ENOENT");

			if (isTsconfigNotFound) {
				// Nuxt projects commonly extend `./.nuxt/tsconfig.json`, which does not
				// exist until Nuxt generates it. Gracefully fall back to loading the
				// schema without tsconfig path resolution so validation can still run
				// during the initial build.
				try {
					const fallbackJiti = createJiti(fileToEvaluate, {
						...jitiOptions,
						tsconfigPaths: false,
					});
					fallbackJiti(fileToEvaluate);
					return;
				} catch (fallbackError: unknown) {
					throw fallbackError;
				}
			}
			throw error;
		}
	} finally {
		const g = globalThis as any;
		g.__arkenv_force_server_count__ = Math.max(
			0,
			(g.__arkenv_force_server_count__ || 0) - 1,
		);
		if (g.__arkenv_force_server_count__ === 0) {
			delete g.__arkenv_force_server__;
			delete g.__arkenv_force_server_count__;
		}
	}
}

/**
 * Extract keys from the schema content using the NUXT_PUBLIC_ prefix.
 *
 * @param content The schema file string content
 * @returns An object containing arrays of server, client, and shared keys
 */
export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	return coreExtractKeys(content, "NUXT_PUBLIC_");
}
