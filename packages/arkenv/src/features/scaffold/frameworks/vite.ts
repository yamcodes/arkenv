import { shake } from "radashi";
import { FRAMEWORK_CLIENT_PREFIXES } from "./client-prefixes";
import {
	getEnvDefaultsFromKeys,
	planSimpleSchemaFile,
	planStrictSchemaFiles,
} from "./shared";
import type { FrameworkStrategy } from "./types";

export const viteStrategy: FrameworkStrategy = {
	clientPrefix: FRAMEWORK_CLIENT_PREFIXES.vite,

	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
			VITE_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	},

	getDependencies() {
		return ["@arkenv/vite-plugin"];
	},

	requiresArktypePeer() {
		return true;
	},

	bootstrap() {
		return shake({ framework: "vite" as const });
	},

	getSchemaFiles(validator, options, params) {
		if (options.layout === "strict") {
			return planStrictSchemaFiles(validator, options, params);
		}
		return planSimpleSchemaFile(validator, options, params);
	},

	getTypeDefinitionFiles() {
		return [];
	},
};
