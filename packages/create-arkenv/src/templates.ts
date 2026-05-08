import type { ProjectOptions } from "./prompts";

export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, framework } = options;

	let imports = "";
	let schema = "";

	switch (validator) {
		case "arktype":
			imports = `import { type } from "arktype";\nimport { arkenv } from "arkenv/arktype";`;
			schema = `const schema = type({
	NODE_ENV: "'development' | 'production' | 'test'",
	PORT: "number > 0",
});`;
			break;
		case "zod":
			imports = `import { z } from "zod";\nimport { arkenv } from "arkenv/zod";`;
			schema = `const schema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	PORT: z.coerce.number().positive(),
});`;
			break;
		case "valibot":
			imports = `import * as v from "valibot";\nimport { arkenv } from "arkenv/valibot";`;
			schema = `const schema = v.object({
	NODE_ENV: v.picklist(["development", "production", "test"]),
	PORT: v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(1)),
});`;
			break;
	}

	const frameworkNote = getFrameworkNote(framework);

	return `${imports}

${schema}

/**
 * ArkEnv handles environment variable validation and type-safety.
 * ${frameworkNote}
 */
export const env = arkenv(schema);
`;
}

function getFrameworkNote(framework: string): string {
	switch (framework) {
		case "vite":
			return "For Vite, ensure you add the @arkenv/vite-plugin to your vite.config.ts.";
		case "bun":
			return "For Bun, ensure you add the @arkenv/bun-plugin to your bun.config.ts or use the preload pattern.";
		case "node":
			return "For Node.js, ArkEnv will read from process.env automatically.";
		default:
			return "";
	}
}
