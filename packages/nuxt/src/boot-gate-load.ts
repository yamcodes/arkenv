import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SchemaShape } from "@repo/types";
import { createJiti } from "jiti";
import {
	beginCapture,
	combineCapturedSchemas,
	endCapture,
	publicKeysFromCaptures,
} from "./capture";
import { withForceServer } from "./validate-context";

export type BootGateEngine = "arktype" | "standard";

export type BootGateConfig = {
	schemaPath: string;
	layout: "simple" | "strict";
	baseDir: string;
	engine: BootGateEngine;
};

/**
 * Build Jiti aliases that point package entry points at this package's source/dist.
 *
 * @param packageDir Absolute directory containing this package's entry files
 * @param resolvedLayout Detected layout mode
 * @param baseDir Strict-layout env directory, or empty for flat
 * @param internalOptions Optional alias overrides for tests
 * @returns Alias map for Jiti
 */
export function buildSchemaJitiAliases(
	packageDir: string,
	resolvedLayout: "simple" | "strict",
	baseDir: string,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): Record<string, string> {
	const packageJsonPath = path.resolve(packageDir, "../package.json");
	let pkgExports: Record<string, unknown> = {};
	try {
		const pkgContent = fs.readFileSync(packageJsonPath, "utf-8");
		pkgExports = JSON.parse(pkgContent).exports || {};
	} catch {
		// fallback if package.json isn't adjacent/found
	}

	const resolveExportPath = (subpath: string, fallbackFile: string): string => {
		const entry = pkgExports[subpath] as
			| { import?: string; default?: string }
			| string
			| undefined;
		if (entry) {
			const target =
				typeof entry === "string"
					? entry
					: entry.import || entry.default || entry;
			if (typeof target === "string") {
				const fileBasename = path.basename(target).replace(/\.m?[jt]s$/, "");
				const tsPath = path.join(packageDir, `${fileBasename}.ts`);
				if (fs.existsSync(tsPath)) {
					return tsPath;
				}
				const jsPath = path.join(packageDir, `${fileBasename}.js`);
				if (fs.existsSync(jsPath)) {
					return jsPath;
				}
			}
		}
		return fallbackFile;
	};

	const sharedPath = resolveExportPath(
		"./shared",
		fs.existsSync(path.join(packageDir, "shared.ts"))
			? path.join(packageDir, "shared.ts")
			: path.join(packageDir, "shared.js"),
	);
	const indexPath = resolveExportPath(
		".",
		fs.existsSync(path.join(packageDir, "index.ts"))
			? path.join(packageDir, "index.ts")
			: path.join(packageDir, "index.js"),
	);
	const clientPath = resolveExportPath(
		"./client",
		fs.existsSync(path.join(packageDir, "client.ts"))
			? path.join(packageDir, "client.ts")
			: path.join(packageDir, "client.js"),
	);
	const serverPath = resolveExportPath(
		"./server",
		fs.existsSync(path.join(packageDir, "server.ts"))
			? path.join(packageDir, "server.ts")
			: path.join(packageDir, "server.js"),
	);
	const standardIndexPath = resolveExportPath(
		"./standard",
		fs.existsSync(path.join(packageDir, "standard/index.ts"))
			? path.join(packageDir, "standard/index.ts")
			: path.join(packageDir, "standard/index.js"),
	);
	const standardClientPath = resolveExportPath(
		"./standard/client",
		fs.existsSync(path.join(packageDir, "standard/client.ts"))
			? path.join(packageDir, "standard/client.ts")
			: path.join(packageDir, "standard/client.js"),
	);
	const standardServerPath = resolveExportPath(
		"./standard/server",
		fs.existsSync(path.join(packageDir, "standard/server.ts"))
			? path.join(packageDir, "standard/server.ts")
			: path.join(packageDir, "standard/server.js"),
	);

	const mockImportsPath = fs.existsSync(
		path.join(packageDir, "mock-imports.ts"),
	)
		? path.join(packageDir, "mock-imports.ts")
		: fs.existsSync(path.join(packageDir, "mock-imports.js"))
			? path.join(packageDir, "mock-imports.js")
			: path.join(packageDir, "mock-imports.cjs");

	const emptyClientEnvPath = fs.existsSync(
		path.join(packageDir, "empty-client-env.ts"),
	)
		? path.join(packageDir, "empty-client-env.ts")
		: path.join(packageDir, "empty-client-env.js");

	const emptySharedSchemaPath = fs.existsSync(
		path.join(packageDir, "empty-shared-schema.ts"),
	)
		? path.join(packageDir, "empty-shared-schema.ts")
		: path.join(packageDir, "empty-shared-schema.js");

	const emptyServerBootPath = fs.existsSync(
		path.join(packageDir, "empty-server-boot.ts"),
	)
		? path.join(packageDir, "empty-server-boot.ts")
		: path.join(packageDir, "empty-server-boot.js");

	const strictUserClientPath =
		resolvedLayout === "strict" && baseDir
			? path.join(baseDir, "client.ts")
			: undefined;

	const strictUserSharedPath =
		resolvedLayout === "strict" && baseDir
			? path.join(baseDir, "internal", "shared.ts")
			: undefined;

	return {
		"@arkenv/nuxt/shared": sharedPath,
		"@arkenv/nuxt": indexPath,
		"@arkenv/nuxt/client": clientPath,
		"@arkenv/nuxt/server": serverPath,
		"@arkenv/nuxt/standard": standardIndexPath,
		"@arkenv/nuxt/standard/client": standardClientPath,
		"@arkenv/nuxt/standard/server": standardServerPath,
		"#imports": mockImportsPath,
		"#arkenv/server-boot": emptyServerBootPath,
		"#arkenv/client-env":
			strictUserClientPath && fs.existsSync(strictUserClientPath)
				? strictUserClientPath
				: emptyClientEnvPath,
		"#arkenv/shared-schema":
			strictUserSharedPath && fs.existsSync(strictUserSharedPath)
				? strictUserSharedPath
				: emptySharedSchemaPath,
		...internalOptions?._jitiAliases,
	};
}

/**
 * Resolve the directory that contains this package's compiled or source entries.
 *
 * @returns Absolute package entry directory
 */
function resolvePackageDir(): string {
	const filenameForJiti =
		typeof __filename !== "undefined"
			? __filename
			: typeof import.meta !== "undefined" && import.meta.url
				? fileURLToPath(import.meta.url)
				: "";
	return path.dirname(filenameForJiti);
}

/**
 * Load user schema files under capture mode and return the combined schema.
 *
 * @param config Boot-gate schema location options
 * @param internalOptions Optional Jiti alias overrides for tests
 * @returns Combined schema and public key set
 */
export function loadSchemaViaCapture(
	config: BootGateConfig,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): { schema: SchemaShape; publicKeys: Set<string> } {
	const packageDir = resolvePackageDir();
	const fileToEvaluate =
		config.layout === "strict" && config.baseDir
			? path.join(config.baseDir, "server.ts")
			: config.schemaPath;

	const aliases = buildSchemaJitiAliases(
		packageDir,
		config.layout,
		config.baseDir,
		internalOptions,
	);

	const jitiOptions = {
		moduleCache: false,
		fsCache: false,
		tsconfigPaths: true,
		alias: aliases,
	} as const;

	const g = globalThis as {
		__ARKENV_STRICT_LAYOUT__?: boolean;
		__ARKENV_CLIENT_ENV__?: unknown;
		__ARKENV_SHARED_SCHEMA__?: unknown;
	};

	return withForceServer(() => {
		beginCapture();
		try {
			const evaluateSchema = (jiti: ReturnType<typeof createJiti>) => {
				if (config.layout === "strict" && config.baseDir) {
					const strictUserSharedPath = path.join(
						config.baseDir,
						"internal",
						"shared.ts",
					);
					// Absent shared.ts → empty merge (aliases already point at
					// empty-shared-schema). A present file must export SharedSchema.
					if (fs.existsSync(strictUserSharedPath)) {
						const sharedMod = jiti(strictUserSharedPath) as {
							SharedSchema?: SchemaShape;
							default?: { SharedSchema?: SchemaShape };
						};
						const sharedSchema =
							sharedMod.SharedSchema ?? sharedMod.default?.SharedSchema;
						if (sharedSchema === undefined || sharedSchema === null) {
							throw new Error(
								`[arkenv] Strict layout requires a usable SharedSchema export from "${strictUserSharedPath}".`,
							);
						}
						g.__ARKENV_SHARED_SCHEMA__ = sharedSchema;
					}

					const strictUserClientPath = path.join(config.baseDir, "client.ts");
					if (fs.existsSync(strictUserClientPath)) {
						g.__ARKENV_STRICT_LAYOUT__ = true;
						const clientMod = jiti(strictUserClientPath) as {
							env?: unknown;
							default?: { env?: unknown };
						};
						g.__ARKENV_CLIENT_ENV__ =
							clientMod.env ?? clientMod.default?.env ?? clientMod;
					}
				}

				jiti(fileToEvaluate);
			};

			try {
				const jiti = createJiti(fileToEvaluate, jitiOptions);
				evaluateSchema(jiti);
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				const isTsconfigNotFound =
					error instanceof Error &&
					/tsconfig/i.test(message) &&
					(/not found/i.test(message) ||
						(error as NodeJS.ErrnoException).code === "ENOENT");

				if (isTsconfigNotFound) {
					const fallbackJiti = createJiti(fileToEvaluate, {
						...jitiOptions,
						tsconfigPaths: false,
					});
					evaluateSchema(fallbackJiti);
				} else {
					throw error;
				}
			}

			const calls = endCapture();
			return {
				schema: combineCapturedSchemas(calls),
				publicKeys: publicKeysFromCaptures(calls),
			};
		} finally {
			endCapture();
			delete g.__ARKENV_STRICT_LAYOUT__;
			delete g.__ARKENV_CLIENT_ENV__;
			delete g.__ARKENV_SHARED_SCHEMA__;
		}
	});
}
