import fs from "node:fs";
import path from "node:path";
import { findSchemaPath } from "@arkenv/build";

/**
 * Strip query suffixes from a module path.
 *
 * @param id The raw module path
 * @returns A filesystem path suitable for comparison
 */
export function normalizeModuleId(id: string): string {
	let normalized = id;
	const queryIndex = normalized.indexOf("?");
	if (queryIndex !== -1) {
		normalized = normalized.slice(0, queryIndex);
	}
	return path.normalize(normalized);
}

/**
 * Check whether a module path refers to the resolved env module.
 *
 * @param id The module path (may include query strings)
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
 * Resolve the absolute env-module path from plugin options and the project root.
 *
 * @param root The project root (typically `process.cwd()`)
 * @param schemaPath An optional relative or absolute schema path from plugin config
 * @param resolveOptions Optional messaging options for missing-module errors
 * @param resolveOptions.isStandard When true, missing-env examples use `@arkenv/standard`
 * @returns The absolute path to the env module
 * @throws If no env module can be found
 */
export function resolveEnvModulePath(
	root: string,
	schemaPath?: string,
	resolveOptions?: { isStandard?: boolean },
): string {
	if (schemaPath) {
		const resolved = path.isAbsolute(schemaPath)
			? schemaPath
			: path.resolve(root, schemaPath);
		if (!fs.existsSync(resolved)) {
			throw new Error(
				`ArkEnv Bun plugin: schemaPath "${schemaPath}" does not exist (resolved to "${resolved}").`,
			);
		}
		return resolved;
	}

	const discovered = findSchemaPath(root);
	if (!discovered) {
		const exampleIntro = resolveOptions?.isStandard
			? "Example `src/env.ts` (Zod shown — any Standard Schema validator works, e.g. Valibot):"
			: "Example `src/env.ts`:";
		const schemaExample = resolveOptions?.isStandard
			? `import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  BUN_PUBLIC_API_URL: z.string(),
  BUN_PUBLIC_DEBUG: z.enum(["true", "false"]),
});`
			: `import arkenv from "@arkenv/core";

export const env = arkenv({
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean",
});`;
		throw new Error(
			`ArkEnv Bun plugin: could not find an env module. Expected "src/env.ts" or "env.ts" under "${root}", or pass schemaPath.\n\n${exampleIntro}\n\`\`\`ts\n${schemaExample}\n\`\`\`\n`,
		);
	}
	return discovered;
}

/**
 * Normalize a `clientPrefix` value to a string array.
 *
 * @param prefix A string prefix, list of prefixes, or undefined
 * @returns A non-empty list of prefixes (defaults to `["BUN_PUBLIC_"]`)
 */
export function normalizePrefixes(
	prefix: string | string[] | undefined,
): string[] {
	if (prefix === undefined) return ["BUN_PUBLIC_"];
	return Array.isArray(prefix) ? prefix : [prefix];
}
