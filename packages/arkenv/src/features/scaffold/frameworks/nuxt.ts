import path from "node:path";
import { shake } from "radashi";
import {
	getEnvDefaultsFromKeys,
	planSimpleSchemaFile,
	planStrictSchemaFiles,
	resolveSimpleImportPath,
	resolveStrictImportPath,
} from "./shared";
import type { FrameworkStrategy } from "./types";

export const nuxtStrategy: FrameworkStrategy = {
	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
			NUXT_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	},

	getDependencies() {
		return ["@arkenv/nuxt"];
	},

	requiresArktypePeer() {
		return true;
	},

	bootstrap(options) {
		return shake({
			framework: "nuxt" as const,
			disableCodegen: options.disableCodegen,
		});
	},

	getSchemaFiles(validator, options, params) {
		if (options.layout === "strict") {
			const ext = path.extname(params.targetPath);
			const baseWithoutExt = params.targetPath.slice(0, -ext.length);
			const importPath = resolveStrictImportPath(
				params,
				baseWithoutExt,
				options,
			);
			return planStrictSchemaFiles(validator, options, params, importPath);
		}

		const importPath = resolveSimpleImportPath(params, options);
		return planSimpleSchemaFile(validator, options, params, importPath);
	},

	getTypeDefinitionFiles() {
		return [];
	},
};
