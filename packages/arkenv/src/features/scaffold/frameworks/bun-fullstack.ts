import { shake } from "radashi";
import { FRAMEWORK_CLIENT_PREFIXES } from "./client-prefixes";
import {
	getEnvDefaultsFromKeys,
	planSimpleSchemaFile,
	planStrictSchemaFiles,
} from "./shared";
import type { FrameworkStrategy } from "./types";

export const bunFullstackStrategy: FrameworkStrategy = {
	clientPrefix: FRAMEWORK_CLIENT_PREFIXES["bun-fullstack"],

	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
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
		if (options.layout === "strict") {
			return planStrictSchemaFiles(validator, options, params);
		}
		return planSimpleSchemaFile(validator, options, params);
	},

	getTypeDefinitionFiles() {
		return [];
	},
};
