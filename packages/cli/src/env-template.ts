import type { ProjectOptions } from "./prompts";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, envKeys } = options;

	switch (validator) {
		case "arktype":
			return arktypeTemplate(envKeys) + "\n";
		case "zod":
			return zodTemplate(envKeys) + "\n";
		case "valibot":
			return valibotTemplate(envKeys) + "\n";
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
}
