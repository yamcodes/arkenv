import path from "node:path";
import { shake } from "radashi";
import { bunTypesTemplate } from "@/features/scaffold/templates";
import { planDtsFile } from "./dts-planning";
import { getEnvDefaultsFromKeys, planSimpleSchemaFile } from "./shared";
import type { FrameworkStrategy } from "./types";

export const bunFullstackStrategy: FrameworkStrategy = {
	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			BUN_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	},

	getDependencies(options) {
		return options.bunFeatures?.length ? ["@arkenv/bun-plugin"] : [];
	},

	requiresArktypePeer(options) {
		return Boolean(options.bunFeatures?.length);
	},

	bootstrap(options) {
		return shake({
			framework: "bun-fullstack" as const,
			bunFeatures: options.bunFeatures,
		});
	},

	getSchemaFiles(validator, options, params) {
		return planSimpleSchemaFile(validator, options, params);
	},

	getTypeDefinitionFiles(options, params) {
		if (
			!options.bunFeatures?.length ||
			options.installTypeDefinitions === false
		) {
			return [];
		}

		const typeFilePath = path.join(params.targetDir, "bun-env.d.ts");

		return planDtsFile({
			typeFilePath,
			typeFileExists: params.existingFiles.includes(typeFilePath),
			envDtsHandling: options.envDtsHandling,
			templateContent: bunTypesTemplate(options.path),
			appendContent: params.targetPath,
			overwriteLabel: "bun-fullstack types",
			appendLabel: `${options.framework} types`,
		});
	},
};
