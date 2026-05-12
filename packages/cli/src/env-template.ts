import type { ProjectOptions } from "./prompts";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, envKeys, framework } = options;

	switch (validator) {
		case "arktype":
			return arktypeTemplate(envKeys, framework) + "\n";
		case "zod":
			return zodTemplate(envKeys, framework) + "\n";
		case "valibot":
			return valibotTemplate(envKeys, framework) + "\n";
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
}
