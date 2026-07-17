import dedent from "dedent";
import type { Dialect } from "@/features/scaffold/validators/dialects";

/**
 * Assemble a Vite or Bun Fullstack Env-only schema template.
 *
 * Dialects supply imports and field lines; this assembler owns the framework
 * comment and `export const Env = type({…})` structure.
 *
 * @param dialect Validator dialect providing imports and field formatting.
 * @param framework Plugin-env framework variant.
 * @param schemaFields Field lines with `\t\t` indentation.
 * @returns Template source without a trailing newline.
 */
export function assemblePluginEnvTemplate(
	dialect: Dialect,
	framework: "vite" | "bun-fullstack",
	schemaFields: string,
): string {
	const importsBlock = dialect.pluginEnvImports
		.split("\n")
		.map((line) => `\t${line}`)
		.join("\n");

	const comment =
		framework === "vite"
			? `Environment variable schema.
	 * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time
	 * and provide typesafety for \`import.meta.env\` on the client-side.`
			: `Environment variable schema.
	 * In Bun Fullstack, use \`@arkenv/bun-plugin\` to validate these at build-time
	 * and provide typesafety for \`process.env\` on the client-side.`;

	return dedent /* ts */`
${importsBlock}

	/**
	 * ${comment}
	 */
	export const Env = type({
		${schemaFields}
	});
	`;
}
