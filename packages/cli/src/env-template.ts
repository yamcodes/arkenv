import type { ProjectOptions } from "./prompts";
import { arktypeTemplate, valibotTemplate, zodTemplate } from "./templates";

export function getEnvTemplate(options: ProjectOptions): string {
	const { validator, framework, envKeys } = options;
	const frameworkNote = getFrameworkNote(framework);

	switch (validator) {
		case "arktype":
			return arktypeTemplate(frameworkNote, envKeys) + "\n";
		case "zod":
			return zodTemplate(frameworkNote, envKeys) + "\n";
		case "valibot":
			return valibotTemplate(frameworkNote, envKeys) + "\n";
		default:
			throw new Error(`Unsupported validator: ${validator}`);
	}
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
