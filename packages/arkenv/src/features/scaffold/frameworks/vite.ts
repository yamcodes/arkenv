import path from "node:path";
import { shake } from "radashi";
import { viteTypesTemplate } from "@/features/scaffold/templates";
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

		const typeFilePath = path.join(params.targetDir, "vite-env.d.ts");
		const typeFileExists = params.existingFiles.includes(typeFilePath);

		if (options.envDtsHandling === "skip") {
			return [];
		}

		if (
			options.envDtsHandling === "append" ||
			(!options.envDtsHandling && typeFileExists)
		) {
			return [
				{
					path: typeFilePath,
					content: params.targetPath,
					action: "append",
					label: `${options.framework} types`,
				},
			];
		}

		return [
			{
				path: typeFilePath,
				content: viteTypesTemplate(options.path),
				action: typeFileExists ? "overwrite" : "create",
				label: "vite types",
			},
		];
	},
};
