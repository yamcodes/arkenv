import fs from "node:fs";
import path from "node:path";
import {
	extractKeys as coreExtractKeys,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	formatMissingSchemaError,
} from "@arkenv/build";
import { type Logger, type LogLevel, resolveBuildLog } from "@repo/log";
import { validateSchema } from "./validate-schema";

export type { Logger } from "@arkenv/build";
export {
	extractArkenvBlock,
	extractServerKeys,
	findSchemaPath,
	formatMissingSchemaError,
} from "@arkenv/build";
export { extractClientKeys, extractSharedKeys, validateSchema };

/**
 * Configuration options for the ArkEnv Nuxt module.
 *
 * Provide these under the `arkenv` key in `nuxt.config.ts`.
 */
export type ArkEnvConfigOptions = {
	/**
	 * Specify the path to the schema definition file.
	 *
	 * When omitted, ArkEnv auto-discovers the schema, searching for `"env.ts"` or
	 * `"src/env.ts"` in the project root.
	 */
	schemaPath?: string;

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
			formatMissingSchemaError({
				schemaPath: options?.schemaPath,
				optionsHint: "ArkEnv options",
			}),
		);
	}

	const runValidation = options?.validate ?? true;
	if (runValidation) {
		try {
			validateSchema(schemaPath, internalOptions);
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
