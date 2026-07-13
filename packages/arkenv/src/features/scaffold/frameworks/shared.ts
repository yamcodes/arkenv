import path from "node:path";
import type { ParsedTsConfig } from "@/shared/ports/project-scanner.port";
import type { Framework, ProjectOptions } from "../plan";
import { createScaffoldContext } from "../scaffold-context";
import type { ValidatorStrategy } from "../validators/types";
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

const STRICT_INTERNAL_DIR = "internal";
const STRICT_SHARED_BASENAME = "shared";
const STRICT_CLIENT_BASENAME = "client";
const STRICT_SERVER_BASENAME = "server";

const CODEGEN_FRAMEWORKS = new Set<Framework>(["nextjs", "nuxt"]);

const SCHEMA_FILE_LABEL = "environment schema";
const SHARED_SCHEMA_FILE_LABEL = "shared environment schema";
const CLIENT_SCHEMA_FILE_LABEL = "client environment schema";
const SERVER_SCHEMA_FILE_LABEL = "server environment schema";

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
		const normalizedPattern = pattern
			.replace(/^\.\//, "")
			.replace(/\*$/, "");
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

function resolveCodegenImportPath(
	params: FrameworkGetFilesParams,
	generatedDir: string,
	options: { framework: Framework; disableCodegen?: boolean },
): string | undefined {
	if (
		!CODEGEN_FRAMEWORKS.has(options.framework) ||
		options.disableCodegen ||
		!params.tsConfig?.parsed
	) {
		return undefined;
	}

	return resolveAliasImportPath(
		params.cwd,
		generatedDir,
		params.tsConfig.parsed,
	);
}

/**
 * Resolve the Next.js/Nuxt generated env import path for simple layouts.
 *
 * @param params File planning parameters.
 * @param options Framework and codegen options.
 * @returns The resolved import path when codegen is enabled.
 */
export function resolveSimpleImportPath(
	params: FrameworkGetFilesParams,
	options: { framework: Framework; disableCodegen?: boolean },
): string | undefined {
	return resolveCodegenImportPath(
		params,
		path.join(params.targetDir, GENERATED_ENV_DIR),
		options,
	);
}

/**
 * Resolve the Next.js/Nuxt generated env import path for strict layouts.
 *
 * @param params File planning parameters.
 * @param baseWithoutExt Absolute path to the env schema base without extension.
 * @param options Framework and codegen options.
 * @returns The resolved import path when codegen is enabled.
 */
export function resolveStrictImportPath(
	params: FrameworkGetFilesParams,
	baseWithoutExt: string,
	options: { framework: Framework; disableCodegen?: boolean },
): string | undefined {
	return resolveCodegenImportPath(
		params,
		path.join(baseWithoutExt, GENERATED_ENV_DIR),
		options,
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

/**
 * Plan strict-layout env schema files using the validator's strict templates.
 *
 * @param validator The validator strategy providing template generation.
 * @param options The selected project options.
 * @param params File planning parameters.
 * @param importPath Optional generated env import path.
 * @returns Planned shared, client, and server schema file actions.
 */
export function planStrictSchemaFiles(
	validator: ValidatorStrategy,
	options: ProjectOptions,
	params: FrameworkGetFilesParams,
	importPath?: string,
) {
	const ext = path.extname(params.targetPath);
	const baseWithoutExt = params.targetPath.slice(0, -ext.length);
	const sharedPath = path.join(
		baseWithoutExt,
		STRICT_INTERNAL_DIR,
		`${STRICT_SHARED_BASENAME}${ext}`,
	);
	const clientPath = path.join(baseWithoutExt, `${STRICT_CLIENT_BASENAME}${ext}`);
	const serverPath = path.join(baseWithoutExt, `${STRICT_SERVER_BASENAME}${ext}`);

	const context = createScaffoldContext(options, importPath);
	const templates = validator.getStrictTemplates(
		options.envKeys ?? [],
		context,
	);

	const sharedExists = params.existingFiles.includes(sharedPath);
	const clientExists = params.existingFiles.includes(clientPath);
	const serverExists = params.existingFiles.includes(serverPath);

	const files = [];

	if (!sharedExists || options.overwriteEnvSchemaFile !== false) {
		files.push({
			path: sharedPath,
			content: templates.shared,
			action: sharedExists ? ("overwrite" as const) : ("create" as const),
			label: SHARED_SCHEMA_FILE_LABEL,
		});
	}
	if (!clientExists || options.overwriteEnvSchemaFile !== false) {
		files.push({
			path: clientPath,
			content: templates.client,
			action: clientExists ? ("overwrite" as const) : ("create" as const),
			label: CLIENT_SCHEMA_FILE_LABEL,
		});
	}
	if (!serverExists || options.overwriteEnvSchemaFile !== false) {
		files.push({
			path: serverPath,
			content: templates.server,
			action: serverExists ? ("overwrite" as const) : ("create" as const),
			label: SERVER_SCHEMA_FILE_LABEL,
		});
	}

	return files;
}
