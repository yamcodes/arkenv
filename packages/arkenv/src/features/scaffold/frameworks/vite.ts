import path from "node:path";
import { shake } from "radashi";
import { viteTypesTemplate } from "@/features/scaffold/templates";
import { planDtsFile } from "./dts-planning";
import { getEnvDefaultsFromKeys, planSimpleSchemaFile } from "./shared";
import type { FrameworkStrategy } from "./types";

export const viteStrategy: FrameworkStrategy = {
	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			PORT: "3000",
			VITE_API_URL: "https://api.example.com",
		};
	},

	getDependencies() {
		return ["@arkenv/vite-plugin"];
	},

	requiresArktypePeer() {
		return true;
	},

	bootstrap(options) {
		return shake({ framework: "vite" as const });
	},

	getSchemaFiles(validator, options, params) {
		return planSimpleSchemaFile(validator, options, params);
	},

	getTypeDefinitionFiles(options, params) {
		if (options.installTypeDefinitions === false) {
			return [];
		}

		return planDtsFile({
			typeFilePath: path.join(params.targetDir, "vite-env.d.ts"),
			typeFileExists: params.existingFiles.includes(
				path.join(params.targetDir, "vite-env.d.ts"),
			),
			envDtsHandling: options.envDtsHandling,
			templateContent: viteTypesTemplate(options.path),
			appendContent: params.targetPath,
			overwriteLabel: "vite types",
			appendLabel: `${options.framework} types`,
		});
	},
};
