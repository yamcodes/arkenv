import type { ProjectOptions } from "./plan";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

/**
 * Generates the complete environment configuration template
 * based on the user's chosen validator and framework.
 *
 * @param options The selected project options.
 * @returns The generated template code.
 */
export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, envKeys, framework } = options;

	switch (validator) {
		case "arktype":
			return `${arktypeTemplate(envKeys, framework)}\n`;
		case "zod":
			return `${zodTemplate(envKeys, framework)}\n`;
		case "valibot":
			return `${valibotTemplate(envKeys, framework)}\n`;
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
}
