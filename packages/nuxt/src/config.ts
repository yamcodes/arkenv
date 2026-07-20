import fs from "node:fs";
import path from "node:path";
import {
	extractKeys as coreExtractKeys,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
import {
	type BuildLogHelpers,
	formatBuildError,
	type Logger,
	type LogLevel,
	resolveBuildLog,
} from "@repo/log";
import { validateSchema } from "./validate-schema";

export type {
	LayoutInput,
	LayoutMode,
	Logger,
	ResolvedLayout,
} from "@arkenv/build";
export {
	extractArkenvBlock,
	extractServerKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
export { extractClientKeys, extractSharedKeys, validateSchema };

let hasWarnedSimpleLayout = false;

export function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
	buildLog: BuildLogHelpers,
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			buildLog.logBuildWarning(
				"The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
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
 * Configuration options for ArkEnv's build-time integration.
 *
 * This is the single source of truth for the options exposed under the `arkenv`
 * key in framework configs (e.g. `nuxt.config.ts`), which is why the field-level
 * JSDoc and `@default` tags live here.
 */
export type ArkEnvConfigOptions = {
	/**
	 * Specify the path to the schema definition file or directory.
	 *
	 * When omitted, ArkEnv auto-discovers the schema, searching for `"env.ts"` or
	 * `"src/env.ts"` (flat layout) or the `"env/"` / `"src/env/"` directory
	 * (strict layout) in the project root.
	 */
	schemaPath?: string;

	/**
	 * Specify the configuration layout.
	 *
	 * When omitted, the layout is auto-detected from the schema structure: it is
	 * `"strict"` when the split files (`env/internal/shared.ts`, `env/client.ts`,
	 * `env/server.ts`) are present, and falls back to `"flat"` (a single
	 * `env.ts`) otherwise.
	 *
	 * - `"flat"`: A single `env.ts` schema file.
	 * - `"strict"`: A multi-file split schema layout.
	 */
	layout?:
		| "flat"
		| "strict"
		/** @deprecated Use `"flat"` instead. */
		| "simple";

	/**
	 * Enable or disable environment variable validation during dev startup and build.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Provide a custom logger to receive ArkEnv's build-time diagnostics.
	 */
	logger?: Logger;

	/**
	 * Control the verbosity of ArkEnv's build-time logging.
	 */
	logLevel?: LogLevel;
};

export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	const buildLog = resolveBuildLog(options);

	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

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
			formatBuildError(
				`Could not find schema file at ${
					options?.schemaPath || "src/env.ts or env.ts"
				}. Please specify 'schemaPath' in ArkEnv options.`,
			),
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout, buildLog);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	const runValidation = options?.validate ?? true;
	if (runValidation) {
		try {
			validateSchema(schemaPath, resolvedLayout, baseDir, internalOptions);
		} catch (error: unknown) {
			buildLog.logBuildError("Environment validation failed:");
			buildLog.logBuildErrorDetail(
				error instanceof Error ? error.message : String(error),
			);
			buildLog.logBuildErrorBlankLine();
			throw error;
		}
	}
}

export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	return coreExtractKeys(content, "NUXT_PUBLIC_");
}
