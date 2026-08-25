import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	findSchemaPath,
	formatMissingSchemaError,
	resolveLayout,
	watchSchema,
} from "@arkenv/build";
import {
	formatBuildError,
	resolveBuildLog,
	resolveLoggerFromOptions,
} from "@repo/log";
import { createJiti } from "jiti";
import {
	CLIENT_ENV_SPECIFIER,
	missingClientTsError,
} from "../strict-client-env";
import { runCodegen } from "./codegen";
import { normalizeLayout } from "./layout";
import { applyStrictLayoutAliases } from "./strict-layout-aliases";
import type { ArkEnvConfigOptions } from "./types";

function resolveMockServerOnlyPath(moduleDir: string): string {
	for (const base of [moduleDir, path.join(moduleDir, "..")]) {
		const tsPath = path.join(base, "mock-server-only.ts");
		if (fs.existsSync(tsPath)) {
			return tsPath;
		}
		const jsPath = path.join(base, "mock-server-only.js");
		if (fs.existsSync(jsPath)) {
			return jsPath;
		}
	}

	return path.join(moduleDir, "mock-server-only.js");
}

function resolveEmptyClientEnvPath(moduleDir: string): string {
	for (const base of [moduleDir, path.join(moduleDir, "..")]) {
		const tsPath = path.join(base, "empty-client-env.ts");
		if (fs.existsSync(tsPath)) {
			return tsPath;
		}
		const jsPath = path.join(base, "empty-client-env.js");
		if (fs.existsSync(jsPath)) {
			return jsPath;
		}
	}

	return path.join(moduleDir, "empty-client-env.js");
}

function schemaPathExists(schemaPath: string): boolean {
	if (fs.existsSync(schemaPath)) return true;

	const ext = path.extname(schemaPath);
	if (!ext) return false;

	const baseWithoutExt = schemaPath.slice(0, -ext.length);
	return fs.existsSync(baseWithoutExt);
}

type SetupResult = {
	resolvedLayout: "flat" | "strict" | "simple";
	baseDir: string | undefined;
	clientEnvPath: string | undefined;
};

/**
 * Run ArkEnv codegen and setup without wrapping nextConfig.
 *
 * @param options Optional configuration paths for schema and output files
 * @param internalOptions Optional configuration for internal testing hooks
 * @returns Resolved layout paths used by `withArkEnv` for alias registration
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): SetupResult {
	const buildLog = resolveBuildLog(options);

	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

	if (!schemaPath || !schemaPathExists(schemaPath)) {
		throw new Error(
			formatMissingSchemaError({
				schemaPath: options?.schemaPath,
				optionsHint: "setupArkEnv options",
			}),
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout, buildLog);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	const clientEnvPath =
		resolvedLayout === "strict" && baseDir
			? path.join(baseDir, "client.ts")
			: undefined;

	if (clientEnvPath && !fs.existsSync(clientEnvPath)) {
		throw new Error(missingClientTsError(clientEnvPath, baseDir!));
	}

	function resolveProjectRoot(
		schema: string,
		base?: string,
		layout?: string,
	): string {
		if (layout === "strict" && base) {
			let dir = base;
			if (path.basename(dir) === "env") {
				dir = path.dirname(dir);
			}
			if (path.basename(dir) === "src") {
				dir = path.dirname(dir);
			}
			return dir;
		}
		let dir = path.dirname(schema);
		if (path.basename(dir) === "src") {
			dir = path.dirname(dir);
		}
		return dir;
	}

	const projectRoot = resolveProjectRoot(schemaPath, baseDir, resolvedLayout);
	const defaultOutputPath = path.join(projectRoot, ".arkenv", "env.gen.ts");
	const outputPath = options?.outputPath
		? path.resolve(options.outputPath)
		: defaultOutputPath;

	const codegen = options?.codegen ?? true;
	if (codegen) {
		try {
			runCodegen(
				schemaPath,
				outputPath,
				resolvedLayout,
				options?.standard,
				options,
			);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				formatBuildError(`Failed to generate env.gen.ts: ${message}`),
			);
		}
	}

	const runValidation = options?.validate ?? true;
	if (runValidation) {
		const g = globalThis as {
			__arkenv_force_server__?: boolean;
			__ARKENV_STRICT_LAYOUT__?: boolean;
			__ARKENV_CLIENT_ENV__?: unknown;
		};
		try {
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
			const mockServerOnlyPath = resolveMockServerOnlyPath(dir);
			const emptyClientEnvPath = resolveEmptyClientEnvPath(dir);

			const aliases: Record<string, string> = {
				"server-only": mockServerOnlyPath,
				"./script": mockServerOnlyPath,
				"./script.tsx": mockServerOnlyPath,
				[CLIENT_ENV_SPECIFIER]:
					clientEnvPath && fs.existsSync(clientEnvPath)
						? clientEnvPath
						: emptyClientEnvPath,
				...internalOptions?._jitiAliases,
			};

			const jiti = createJiti(fileToEvaluate, {
				moduleCache: false,
				fsCache: false,
				tsconfigPaths: true,
				alias: aliases,
			});

			if (resolvedLayout === "strict" && clientEnvPath) {
				g.__ARKENV_STRICT_LAYOUT__ = true;
				const clientMod = jiti(clientEnvPath) as {
					env?: unknown;
					default?: { env?: unknown };
				};
				g.__ARKENV_CLIENT_ENV__ =
					clientMod.env ?? clientMod.default?.env ?? clientMod;
			}

			jiti(fileToEvaluate);
		} catch (error: unknown) {
			buildLog.logBuildError("Environment validation failed:");
			buildLog.logBuildErrorDetail(
				error instanceof Error ? error.message : String(error),
			);
			buildLog.logBuildErrorBlankLine();
			process.exit(1);
		} finally {
			delete g.__arkenv_force_server__;
			delete g.__ARKENV_STRICT_LAYOUT__;
			delete g.__ARKENV_CLIENT_ENV__;
		}
	}

	const isDev =
		process.env.NODE_ENV === "development" ||
		process.env.NEXT_PHASE === "phase-development-server";
	if (isDev && codegen) {
		const watchPaths =
			resolvedLayout === "strict" && baseDir
				? [
						path.join(baseDir, "internal", "shared.ts"),
						path.join(baseDir, "client.ts"),
						path.join(baseDir, "server.ts"),
					].filter(fs.existsSync)
				: [schemaPath];
		watchSchema(
			watchPaths,
			() => {
				runCodegen(
					schemaPath,
					outputPath,
					resolvedLayout,
					options?.standard,
					options,
				);
			},
			resolveLoggerFromOptions(options),
		);
	}

	return {
		resolvedLayout,
		baseDir,
		clientEnvPath,
		outputPath,
	};
}

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv`
 * block in `env.gen.ts`, register `#arkenv/client-env` in strict layout for auto-extend,
 * and configure Turbopack/Webpack aliases for virtualized `.arkenv/` placement.
 *
 * @param nextConfig The Next.js configuration object
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object with configured aliases
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	const {
		resolvedLayout,
		clientEnvPath,
		outputPath: targetGenPath,
	} = setupArkEnv(options);

	const applyVirtualAliases = (configObj: any) => {
		const rootDir = process.cwd();

		const targetGenPathToUse =
			targetGenPath ??
			(options?.outputPath
				? path.resolve(options.outputPath)
				: path.join(rootDir, ".arkenv", "env.gen.ts"));

		const relativeGenPath =
			"./" + path.relative(rootDir, targetGenPathToUse).replace(/\\/g, "/");

		const turbopack = {
			...configObj?.turbopack,
			resolveAlias: {
				".arkenv/env.gen": relativeGenPath,
				".arkenv/env.gen.ts": relativeGenPath,
				".arkenv": relativeGenPath,
				".arkenv/index": relativeGenPath,
				".arkenv/index.ts": relativeGenPath,
				"#arkenv/env": relativeGenPath,
				"@/.arkenv": relativeGenPath,
				"@/.arkenv/env.gen": relativeGenPath,
				...configObj?.turbopack?.resolveAlias,
			},
		};

		const webpack = (webpackConfig: any, context: any) => {
			webpackConfig.resolve = webpackConfig.resolve || {};
			webpackConfig.resolve.alias = {
				...webpackConfig.resolve.alias,
				".arkenv/env.gen": targetGenPathToUse,
				".arkenv/env.gen.ts": targetGenPathToUse,
				".arkenv": targetGenPathToUse,
				".arkenv/index": targetGenPathToUse,
				".arkenv/index.ts": targetGenPathToUse,
				"#arkenv/env": targetGenPathToUse,
				"@/.arkenv": targetGenPathToUse,
				"@/.arkenv/env.gen": targetGenPathToUse,
			};
			if (typeof configObj?.webpack === "function") {
				return configObj.webpack(webpackConfig, context);
			}
			return webpackConfig;
		};

		return {
			...configObj,
			turbopack,
			webpack,
		};
	};

	const applyAllAliases = (configObj: any) => {
		let currentConfig = configObj;
		if (resolvedLayout === "strict" && clientEnvPath) {
			currentConfig = applyStrictLayoutAliases(
				currentConfig as Record<string, unknown>,
				clientEnvPath,
				CLIENT_ENV_SPECIFIER,
			);
		}
		return applyVirtualAliases(currentConfig);
	};

	if (typeof nextConfig === "function") {
		return ((phase: any, context: any) => {
			const resolved = (nextConfig as any)(phase, context);
			return applyAllAliases(resolved);
		}) as unknown as T;
	}

	if (nextConfig && typeof nextConfig === "object") {
		return applyAllAliases(nextConfig) as T;
	}

	return nextConfig;
}
