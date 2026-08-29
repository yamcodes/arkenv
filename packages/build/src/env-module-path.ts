import fs from "node:fs";
import path from "node:path";
import {
	assertFlatSchemaFile,
	findSchemaPath,
	formatMissingSchemaError,
	getDefaultSchemaFileCandidates,
} from "./core";

/**
 * Strip virtual-module and query suffixes from a module id or file path,
 * normalizing path separators across platforms.
 *
 * @param id The raw module id or path
 * @returns A filesystem path suitable for comparison
 */
export function normalizeModuleId(id: string): string {
	let normalized = id;
	if (normalized.startsWith("\0")) {
		normalized = normalized.slice(1);
	}
	const queryIndex = normalized.indexOf("?");
	if (queryIndex !== -1) {
		normalized = normalized.slice(0, queryIndex);
	}
	return path.normalize(normalized);
}

/**
 * Check whether a module id or path refers to the resolved env module.
 *
 * @param id The module id or path (may include query strings or virtual prefixes)
 * @param schemaPath The absolute path to the env module
 * @returns Whether `id` identifies the same module as `schemaPath`
 */
export function isEnvModuleId(id: string, schemaPath: string): boolean {
	const stripExt = (filePath: string) =>
		filePath.replace(/\.(m|c)?[jt]sx?$/, "");

	const normalizedId = path.resolve(normalizeModuleId(id));
	const normalizedSchema = path.resolve(schemaPath);
	if (normalizedId === normalizedSchema) return true;
	if (stripExt(normalizedId) === stripExt(normalizedSchema)) return true;

	try {
		const realId = fs.existsSync(normalizedId)
			? fs.realpathSync(normalizedId)
			: normalizedId;
		const realSchema = fs.existsSync(normalizedSchema)
			? fs.realpathSync(normalizedSchema)
			: normalizedSchema;
		if (realId === realSchema) return true;
		if (stripExt(realId) === stripExt(realSchema)) return true;
	} catch {
		// Ignore filesystem errors for virtual or missing files
	}

	return false;
}

/**
 * Resolve the absolute env-module path from options and a project root.
 *
 * @param root The project root directory
 * @param schemaPath An optional relative or absolute schema path from config
 * @param prefix Brand prefix for diagnostics (e.g. `"[ArkEnv]"`, `"ArkEnv Vite plugin:"`, `"ArkEnv Bun plugin:"`)
 * @returns The absolute path to the env module file
 * @throws If no env module can be found, if schemaPath does not exist, or if the path is a directory
 */
export function resolveEnvModulePath(
	root: string,
	schemaPath?: string,
	prefix = "[ArkEnv]",
): string {
	const cleanPrefix = prefix.trim().endsWith(":")
		? prefix.trim()
		: `${prefix.trim()}:`;
	if (schemaPath) {
		const resolved = path.isAbsolute(schemaPath)
			? schemaPath
			: path.resolve(root, schemaPath);
		if (!fs.existsSync(resolved)) {
			throw new Error(
				`${cleanPrefix} schemaPath "${schemaPath}" does not exist (resolved to "${resolved}").`,
			);
		}
		return assertFlatSchemaFile(resolved, cleanPrefix);
	}

	const discovered = findSchemaPath(root);
	if (!discovered) {
		throw new Error(
			formatMissingSchemaError({
				prefix: cleanPrefix,
				optionsHint: "plugin options",
				checkedPaths: getDefaultSchemaFileCandidates(root),
			}),
		);
	}
	return assertFlatSchemaFile(discovered, cleanPrefix);
}

/**
 * Normalize a `clientPrefix` value to a string array.
 *
 * @param prefix A string prefix, list of prefixes, or undefined
 * @param defaultPrefix Fallback prefix(es) to use when `prefix` is undefined
 * @returns A list of prefixes
 */
export function normalizePrefixes(
	prefix: string | string[] | undefined,
	defaultPrefix: string | string[] = [],
): string[] {
	if (prefix === undefined) {
		return Array.isArray(defaultPrefix) ? defaultPrefix : [defaultPrefix];
	}
	return Array.isArray(prefix) ? prefix : [prefix];
}

/**
 * Check whether a changed file is a dotenv file.
 *
 * @param file Absolute path or filename of the changed file
 * @returns Whether the file looks like a `.env` / `.env.*` file
 */
export function isDotEnvFile(file: string): boolean {
	return /^\.env(?:\..+)?$/.test(path.basename(file));
}
