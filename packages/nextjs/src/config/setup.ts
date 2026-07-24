import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSchemaPath, resolveLayout, watchSchema } from "@arkenv/build";
import {
	formatBuildError,
	resolveBuildLog,
	resolveLoggerFromOptions,
} from "@repo/log";
import { createJiti } from "jiti";
import { runCodegen } from "./codegen";
import { normalizeLayout } from "./layout";
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

function schemaPathExists(schemaPath: string): boolean {
	if (fs.existsSync(schemaPath)) return true;

	const ext = path.extname(schemaPath);
	if (!ext) return false;

	const baseWithoutExt = schemaPath.slice(0, -ext.length);
	return fs.existsSync(baseWithoutExt);
}

/**
 * Run ArkEnv codegen and setup without wrapping nextConfig.
 *
 * @param options Optional configuration paths for schema and output files
 * @param internalOptions Optional configuration for internal testing hooks
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	const buildLog = resolveBuildLog(options);

	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

	if (!schemaPath || !schemaPathExists(schemaPath)) {
		throw new Error(
			formatBuildError(
				`Could not find schema file at ${
					options?.schemaPath || "src/env.ts or env.ts"
				}. Please specify 'schemaPath' in setupArkEnv options (or run \`arkenv init\`).`,
			),
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout, buildLog);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	const defaultOutputDir =
		resolvedLayout === "strict" && baseDir ? baseDir : path.dirname(schemaPath);
	const defaultOutputPath = path.join(
		defaultOutputDir,
		"generated",
		"env.gen.ts",
	);
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
		try {
			(globalThis as any).__arkenv_force_server__ = true;
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

			const aliases: Record<string, string> = {
				"server-only": mockServerOnlyPath,
				"./script": mockServerOnlyPath,
				"./script.tsx": mockServerOnlyPath,
				...internalOptions?._jitiAliases,
			};

			const jiti = createJiti(fileToEvaluate, {
				moduleCache: false,
				fsCache: false,
				tsconfigPaths: true,
				alias: aliases,
			});
			jiti(fileToEvaluate);
		} catch (error: unknown) {
			buildLog.logBuildError("Environment validation failed:");
			buildLog.logBuildErrorDetail(
				error instanceof Error ? error.message : String(error),
			);
			buildLog.logBuildErrorBlankLine();
			process.exit(1);
		} finally {
			delete (globalThis as any).__arkenv_force_server__;
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
}

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv` block in `env.gen.ts`.
 *
 * @param nextConfig The Next.js configuration object or function
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object unchanged
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	setupArkEnv(options);
	return nextConfig;
}
