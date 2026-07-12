import { getEnvDefaultsFromKeys, planSimpleSchemaFile } from "./shared";
import type { FrameworkStrategy } from "./types";

export const vanillaStrategy: FrameworkStrategy = {
	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			PORT: "3000",
			NODE_ENV: "development",
		};
	},

	getDependencies() {
		return [];
	},

	requiresArktypePeer() {
		return false;
	},

	bootstrap() {
		return undefined;
	},

	getSchemaFiles(validator, options, params) {
		return planSimpleSchemaFile(validator, options, params);
	},

	getTypeDefinitionFiles() {
		return [];
	},
};
