import type { Validator } from "./plan";

/**
 * Framework integration packages that ship an ArkType entry and a `/standard` entry.
 */
export type IntegrationPackage =
	| "@arkenv/nextjs"
	| "@arkenv/nuxt"
	| "@arkenv/vite-plugin"
	| "@arkenv/rsbuild-plugin"
	| "@arkenv/bun-plugin";

/**
 * Whether this validator uses `@arkenv/standard` instead of ArkType.
 *
 * @param validator The validator selected during init
 * @returns True for Zod and Valibot
 */
export function usesStandardEngine(validator: Validator): boolean {
	return validator !== "arktype";
}

/**
 * Build the package specifier for a framework integration.
 *
 * Zod and Valibot use the `/standard` entry. ArkType uses the package root,
 * then an optional `config` or `module` subpath.
 *
 * @param pkg Framework integration package name
 * @param standard Whether to select the Standard Schema entry
 * @param subpath Optional `config` or `module` subpath after the engine segment
 * @returns The specifier init should install, import, or register
 */
export function integrationEntry(
	pkg: IntegrationPackage,
	standard: boolean,
	subpath?: "config" | "module",
): string {
	const engine = standard ? "/standard" : "";
	const tail = subpath ? `/${subpath}` : "";
	return `${pkg}${engine}${tail}`;
}
