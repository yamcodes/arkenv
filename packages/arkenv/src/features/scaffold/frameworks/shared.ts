import path from "node:path";
import type { Framework, ProjectOptions } from "@/features/scaffold/plan";
import { createScaffoldContext } from "@/features/scaffold/scaffold-context";
import type { ValidatorStrategy } from "@/features/scaffold/validators/types";
import type { ParsedTsConfig } from "@/shared/ports/project-scanner.port";
import { isCodegenFramework } from "./codegen-config";
import type { FrameworkGetFilesParams } from "./types";

const ENV_KEY_DEFAULTS: Record<string, string> = {
	NODE_ENV: "development",
	PORT: "3000",
	DATABASE_URL: "postgres://localhost:5432/mydb",
};

const TS_CONFIG_ALIAS_KEY = "@/*";
const PATH_ALIAS_PREFIX = "@/";
const GENERATED_ENV_DIR = "generated";
const GENERATED_ENV_MODULE = "env.gen";

/**
 * Public import for the Next.js codegen factory. `withArkEnv` aliases this
 * specifier to the generated file. `tsc` resolves it through `.arkenv/index.ts`.
 */
export const NEXTJS_VIRTUAL_FACTORY_IMPORT = "@/.arkenv";

const SCHEMA_FILE_LABEL = "environment schema";

/**
 * Build default env var values from explicit keys.
 *
 * @param keys Environment variable keys.
 * @returns A map of env var names to default values.
 */
export function getEnvDefaultsFromKeys(keys: string[]): Record<string, string> {
	const defaults: Record<string, string> = {};
	for (const key of keys) {
		defaults[key] = ENV_KEY_DEFAULTS[key] ?? "";
	}
	return defaults;
}

/**
 * Resolve the generated env import path from tsconfig path aliases.
 *
 * @param cwd The project root directory.
 * @param generatedDir Absolute path to the generated env directory.
 * @param tsConfig Parsed tsconfig data.
 * @returns An alias-based import path or undefined when no mapping matches.
 */
export function resolveAliasImportPath(
	cwd: string,
	generatedDir: string,
	tsConfig?: ParsedTsConfig,
): string | undefined {
	if (!tsConfig) {
		return undefined;
	}

	const compilerOptions = tsConfig.compilerOptions || {};
	const paths = compilerOptions.paths || {};
	const aliasPatterns = paths[TS_CONFIG_ALIAS_KEY];
	if (!aliasPatterns) {
		return undefined;
	}

	const tsConfigDir = tsConfig.path ? path.dirname(tsConfig.path) : cwd;
	const relGeneratedDir = path
		.relative(tsConfigDir, generatedDir)
		.replace(/\\/g, "/");

	for (const pattern of aliasPatterns) {
		const normalizedPattern = pattern.replace(/^\.\//, "").replace(/\*$/, "");
		if (
			normalizedPattern === "" ||
			relGeneratedDir.startsWith(normalizedPattern)
		) {
			let subPath = relGeneratedDir;
			if (
				normalizedPattern !== "" &&
				relGeneratedDir.startsWith(normalizedPattern)
			) {
				subPath = relGeneratedDir.substring(normalizedPattern.length);
			}
			subPath = subPath.replace(/^\/+/, "").replace(/\/+$/, "");
			return `${PATH_ALIAS_PREFIX}${subPath}/${GENERATED_ENV_MODULE}`.replace(
				/\/+/g,
				"/",
			);
		}
	}

	return undefined;
}

/**
 * Resolve the Next.js/Nuxt generated env import path for flat schemas.
 *
 * @param params File planning parameters.
 * @param options Framework and codegen options.
 * @returns The resolved import path when codegen is enabled.
 */
export function resolveSimpleImportPath(
	params: FrameworkGetFilesParams,
	options: { framework: Framework; disableCodegen?: boolean },
): string | undefined {
	if (!isCodegenFramework(options.framework) || options.disableCodegen) {
		return undefined;
	}

	if (options.framework === "nextjs") {
		return NEXTJS_VIRTUAL_FACTORY_IMPORT;
	}

	if (!params.tsConfig?.parsed) {
		return undefined;
	}

	return resolveAliasImportPath(
		params.cwd,
		path.join(params.targetDir, GENERATED_ENV_DIR),
		params.tsConfig.parsed,
	);
}

/**
 * Plan a single env schema file using the validator's simple template.
 *
 * @param validator The validator strategy providing template generation.
 * @param options The selected project options.
 * @param params File planning parameters.
 * @param importPath Optional generated env import path.
 * @returns Planned schema file actions.
 */
export function planSimpleSchemaFile(
	validator: ValidatorStrategy,
	options: ProjectOptions,
	params: FrameworkGetFilesParams,
	importPath?: string,
) {
	const context = createScaffoldContext(options, importPath);
	const envContent = validator.getSimpleTemplate(
		options.envKeys ?? [],
		context,
	);
	const envFileExists = params.existingFiles.includes(params.targetPath);

	if (!envFileExists || options.overwriteEnvSchemaFile !== false) {
		return [
			{
				path: params.targetPath,
				content: envContent,
				action: envFileExists ? ("overwrite" as const) : ("create" as const),
				label: SCHEMA_FILE_LABEL,
			},
		];
	}

	return [];
}
