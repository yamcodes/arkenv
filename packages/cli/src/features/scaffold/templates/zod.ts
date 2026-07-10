import dedent from "dedent";
import { buildNextjsTemplate } from "./nextjs-template";
import { getFrameworkPrefix, getPresetKeys, getFieldDefinition, type HostPreset } from "./presets";

/**
 * Generate a TypeScript template string for a Zod environment configuration.
 *
 * @param envKeys Optional array of environment variable keys to include in the schema
 * @param framework The framework being used (vite, bun-fullstack, or vanilla)
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @param disableCodegen Whether automatic Next.js code generation is disabled
 * @param layout The layout structure to use (strict, simple, or flat)
 * @param hostPreset The selected hosting provider preset
 * @returns The generated TypeScript template string
 */
export const zodTemplate = (
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
		schemaFields = uniqueKeys.map((key) => `\t\t${key}: ${getFieldDefinition(key, "zod", prefix)},`).join("\n");
	} else {
		schemaFields = `\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),`;
	}

	if (framework === "vite") {
		return dedent /* ts */`
	import { type } from "arkenv";
	import { z } from "zod";

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
	import { z } from "zod";

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
				extraImports: `import { z } from "zod";`,
				serverField: (key) => `\t\t${key}: ${getFieldDefinition(key, "zod", clientPrefix)},`,
				clientField: (key) => `\t\t${key}: ${getFieldDefinition(key, "zod", clientPrefix)},`,
				sharedField: (key) =>
					`\t\t${key}: ${getFieldDefinition(key, "zod", clientPrefix)},`,
				defaultServerFields: [
					`\t\tDATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
				],
				defaultClientFields: [
					`\t\t${clientPrefix}API_URL: z.string().url().default("https://api.example.com"),`,
				],
				defaultSharedFields: [
					`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
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
	import { z } from "zod";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
};
