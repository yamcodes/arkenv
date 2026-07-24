import fs from "node:fs";
import path from "node:path";
import { findSchemaPath } from "@arkenv/build";

/**
 * Strip Vite virtual-module and query suffixes from a module id.
 *
 * @param id The raw Vite module id
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
 * Check whether a Vite module id refers to the resolved env module.
 *
 * @param id The Vite module id (may include query strings)
 * @param schemaPath The absolute path to the env module
 * @returns Whether `id` identifies the same module as `schemaPath`
 */
export function isEnvModuleId(id: string, schemaPath: string): boolean {
	const normalizedId = path.resolve(normalizeModuleId(id));
	const normalizedSchema = path.resolve(schemaPath);
	if (normalizedId === normalizedSchema) return true;

	const stripExt = (filePath: string) =>
		filePath.replace(/\.(m|c)?[jt]sx?$/, "");
	return stripExt(normalizedId) === stripExt(normalizedSchema);
}

/**
 * Resolve the absolute env-module path from plugin options and the Vite root.
 *
 * @param root The Vite project root
 * @param schemaPath An optional relative or absolute schema path from plugin config
 * @returns The absolute path to the env module
 * @throws If no env module can be found
 */
export function resolveEnvModulePath(
	root: string,
	schemaPath?: string,
): string {
	if (schemaPath) {
		const resolved = path.isAbsolute(schemaPath)
			? schemaPath
			: path.resolve(root, schemaPath);
		if (!fs.existsSync(resolved)) {
			throw new Error(
				`ArkEnv Vite plugin: schemaPath "${schemaPath}" does not exist (resolved to "${resolved}").`,
			);
		}
		return resolved;
	}

	const discovered = findSchemaPath(root);
	if (!discovered) {
		throw new Error(
			`ArkEnv Vite plugin: could not find an env module. Expected "src/env.ts" or "env.ts" under "${root}", or pass schemaPath (or run \`arkenv init\`).`,
		);
	}
	return discovered;
}

/**
 * Normalize a Vite `envPrefix` / `clientPrefix` value to a string array.
 *
 * @param prefix A string prefix, list of prefixes, or undefined
 * @returns A non-empty list of prefixes (defaults to `["VITE_"]`)
 */
export function normalizePrefixes(
	prefix: string | string[] | undefined,
): string[] {
	if (prefix === undefined) return ["VITE_"];
	return Array.isArray(prefix) ? prefix : [prefix];
}

/**
 * Check whether a changed file is a dotenv file Vite may load.
 *
 * @param file Absolute path of the changed file
 * @returns Whether the file looks like a `.env` / `.env.*` file
 */
export function isDotEnvFile(file: string): boolean {
	return /^\.env(?:\..+)?$/.test(path.basename(file));
}
