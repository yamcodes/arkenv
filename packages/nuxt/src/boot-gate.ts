import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Dict, SchemaShape } from "@repo/types";
import { createJiti } from "jiti";
import {
	getBootGateResult,
	isBootGateDone,
	resetBootGateResultForTests,
	setBootGateResult,
} from "./boot-gate-state";
import {
	beginCapture,
	combineCapturedSchemas,
	endCapture,
	publicKeysFromCaptures,
} from "./capture";
import { resolveCoreArkenv } from "./resolve-core-arkenv";
import { withForceServer } from "./validate-context";

export type BootGateEngine = "arktype" | "standard";

export type BootGateConfig = {
	schemaPath: string;
	layout: "simple" | "strict";
	baseDir: string;
	engine: BootGateEngine;
};

export type BootGateRuntimeConfig = {
	public?: Record<string, unknown>;
	arkenvGate?: BootGateConfig;
	[key: string]: unknown;
};

let gateConfig: BootGateConfig | null = null;

export {
	getBootGateResult,
	isBootGateDone,
} from "./boot-gate-state";

/**
 * Store boot-gate configuration for {@link ensureBootGate}.
 *
 * @param config Schema path, layout, and validation engine
 */
export function configureBootGate(config: BootGateConfig): void {
	gateConfig = config;
}

/**
 * Return the current boot-gate configuration, if any.
 *
 * @returns The configured gate options, or `null`
 */
export function getBootGateConfig(): BootGateConfig | null {
	return gateConfig;
}

/**
 * Reset boot-gate state (tests only).
 */
export function resetBootGateForTests(): void {
	gateConfig = null;
	resetBootGateResultForTests();
}

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
					if (!fs.existsSync(strictUserSharedPath)) {
						throw new Error(
							`[arkenv] Strict layout requires "internal/shared.ts" with a usable SharedSchema export under "${config.baseDir}".`,
						);
					}

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

/**
 * Flatten Nuxt `runtimeConfig` into a single key→value map for validation.
 *
 * @param runtimeConfig The live Nitro runtime config (after string overrides)
 * @returns Flat env map including public keys at the top level
 */
export function flattenRuntimeConfig(
	runtimeConfig: BootGateRuntimeConfig,
): Record<string, unknown> {
	const { public: publicConfig, arkenvGate: _gate, ...rest } = runtimeConfig;
	const flat: Record<string, unknown> = { ...rest };
	if (publicConfig && typeof publicConfig === "object") {
		Object.assign(flat, publicConfig);
	}
	return flat;
}

/**
 * Write coerced values back into `runtimeConfig`, including `public`.
 *
 * @param runtimeConfig The live Nitro runtime config to mutate
 * @param coerced Validated/coerced values from core
 * @param publicKeys Keys that belong under `runtimeConfig.public`
 */
export function applyCoercedToRuntimeConfig(
	runtimeConfig: BootGateRuntimeConfig,
	coerced: Record<string, unknown>,
	publicKeys: Set<string>,
): void {
	runtimeConfig.public = runtimeConfig.public || {};

	for (const [key, value] of Object.entries(coerced)) {
		if (publicKeys.has(key)) {
			runtimeConfig.public[key] = value;
		} else {
			runtimeConfig[key] = value;
		}
	}
}

/**
 * Run the Nuxt boot gate: capture schema, validate/coerce against live config, write back.
 *
 * @param config Schema path and engine
 * @param runtimeConfig Live Nitro runtime config (mutated in place)
 * @param internalOptions Optional Jiti overrides for tests
 * @returns Flattened coerced values
 * @throws When validation fails (fail-fast)
 */
export function runBootGate(
	config: BootGateConfig,
	runtimeConfig: BootGateRuntimeConfig,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): Record<string, unknown> {
	const { schema, publicKeys } = loadSchemaViaCapture(config, internalOptions);

	if (Object.keys(schema).length === 0) {
		const flat = flattenRuntimeConfig(runtimeConfig);
		setBootGateResult(flat);
		return flat;
	}

	const sourceValues = flattenRuntimeConfig(runtimeConfig);
	const processEnv =
		typeof process !== "undefined" ? (process.env as Dict<string>) : {};

	// `runtimeConfig` after Nitro boot is authoritative — including deliberate empty
	// string overrides (`NUXT_PUBLIC_FOO=""`). Spread `process.env` first as a
	// fallback for keys Nitro has not projected into config yet.
	const combinedEnv: Record<string, unknown> = { ...processEnv };
	for (const [key, value] of Object.entries(sourceValues)) {
		if (value !== undefined) {
			combinedEnv[key] = value;
		}
	}

	const coreArkenv = resolveCoreArkenv(config.engine);
	const coerced = coreArkenv(schema, {
		env: combinedEnv as Dict<string>,
		safe: false,
	});

	applyCoercedToRuntimeConfig(runtimeConfig, coerced, publicKeys);
	setBootGateResult({ ...coerced });
	return getBootGateResult() as Record<string, unknown>;
}

/**
 * Ensure the boot gate has run once (eager plugin + thin server accessor).
 *
 * Reads `arkenvGate` from `runtimeConfig` when {@link configureBootGate} was not called.
 * No-ops when neither config nor a usable runtimeConfig gate block is available.
 *
 * @param runtimeConfig Optional live runtime config (from Nitro plugin / tests)
 */
export function ensureBootGate(runtimeConfig?: BootGateRuntimeConfig): void {
	if (isBootGateDone()) return;

	const config =
		gateConfig ||
		(runtimeConfig?.arkenvGate as BootGateConfig | undefined) ||
		null;

	if (!config?.schemaPath) {
		return;
	}

	const rc =
		runtimeConfig ||
		({
			public: {},
		} as BootGateRuntimeConfig);

	if (!rc.arkenvGate) {
		rc.arkenvGate = config;
	}

	configureBootGate(config);
	runBootGate(config, rc);
}
