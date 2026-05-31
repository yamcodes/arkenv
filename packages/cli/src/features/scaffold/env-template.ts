import type { ProjectOptions } from "./plan";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

/**
 * Generate the complete environment configuration template
 * based on the user's chosen validator and framework.
 *
 * @param options The selected project options
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js
 * @returns The generated template code
 */
export function getEnvTemplate(
	options: ProjectOptions,
	nextjsImportPath?: string,
): string {
	const { validator, envKeys, framework, disableCodegen } = options;

	switch (validator) {
		case "arktype":
			return `${arktypeTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
		case "zod":
			return `${zodTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
		case "valibot":
			return `${valibotTemplate(envKeys, framework, nextjsImportPath, disableCodegen)}\n`;
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
}
