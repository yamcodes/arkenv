import dedent from "dedent";
import { buildNextjsTemplate } from "./nextjs-template";
import { getFrameworkPrefix, getPresetKeys, getFieldDefinition, type HostPreset } from "./presets";

/**
 * Generate a TypeScript template string for a Valibot environment configuration.
 *
 * @param envKeys Optional array of environment variable keys to include in the schema
 * @param framework The framework being used (vite, bun-fullstack, or vanilla)
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @param disableCodegen Whether automatic Next.js code generation is disabled
 * @param layout The layout structure to use (strict, simple, or flat)
 * @param hostPreset The selected hosting provider preset
 * @returns The generated TypeScript template string
 */
export const valibotTemplate = (
	envKeys?: string[],
	framework?: string,
	nextjsImportPath?: string,
	disableCodegen?: boolean,
	layout?: "strict" | "simple" | "flat",
	hostPreset?: HostPreset,
) => {
	const prefix = getFrameworkPrefix(framework as any);
	const presetKeys = hostPreset ? getPresetKeys(hostPreset, prefix) : [];

	let schemaFields = "";
	if (envKeys?.length || presetKeys.length) {
		const baseKeys = envKeys || [];
		const uniqueKeys = Array.from(new Set([...baseKeys, ...presetKeys]));
		schemaFields = uniqueKeys.map((key) => `\t\t${key}: ${getFieldDefinition(key, "valibot", prefix)},`).join("\n");
	} else {
		schemaFields = `\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
		PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),`;
	}

	if (framework === "vite") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import * as v from "valibot";

	/**
	 * Environment variable schema.
	 * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time
	 * and provide typesafety for \`import.meta.env\` on the client-side.
	 */
	export const Env = type({
		${schemaFields}
	});
	`;
	}

	if (framework === "bun-fullstack") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import * as v from "valibot";

	/**
	 * Environment variable schema.
	 * In Bun Fullstack, use \`@arkenv/bun-plugin\` to validate these at build-time
	 * and provide typesafety for \`process.env\` on the client-side.
	 */
	export const Env = type({
		${schemaFields}
	});
	`;
	}

	if (framework === "nextjs" || framework === "nuxt") {
		const clientPrefix = framework === "nuxt" ? "NUXT_PUBLIC_" : "NEXT_PUBLIC_";
		return buildNextjsTemplate(
			envKeys,
			{
				extraImports: `import * as v from "valibot";`,
				serverField: (key) => `\t\t${key}: ${getFieldDefinition(key, "valibot", clientPrefix)},`,
				clientField: (key) => `\t\t${key}: ${getFieldDefinition(key, "valibot", clientPrefix)},`,
				sharedField: (key) =>
					`\t\t${key}: ${getFieldDefinition(key, "valibot", clientPrefix)},`,
				defaultServerFields: [
					`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
				],
				defaultClientFields: [
					`\t\t${clientPrefix}API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
				],
				defaultSharedFields: [
					`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
				],
			},
			nextjsImportPath,
			disableCodegen,
			framework,
			layout,
			hostPreset,
		);
	}

	return dedent /* ts */`
	import arkenv from "arkenv/standard";
	import * as v from "valibot";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
};
