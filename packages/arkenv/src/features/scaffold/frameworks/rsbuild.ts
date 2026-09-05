import { shake } from "radashi";
import { FRAMEWORK_CLIENT_PREFIXES } from "./client-prefixes";
import { getEnvDefaultsFromKeys, planSimpleSchemaFile } from "./shared";
import type { FrameworkStrategy } from "./types";

export const rsbuildStrategy: FrameworkStrategy = {
	clientPrefix: FRAMEWORK_CLIENT_PREFIXES.rsbuild,

	getEnvDefaults(keys) {
		if (keys && keys.length > 0) {
			return getEnvDefaultsFromKeys(keys);
		}
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
			PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	},

	getDependencies() {
		return ["@arkenv/rsbuild-plugin"];
	},

	requiresArktypePeer() {
		return true;
	},

	bootstrap() {
		return shake({ framework: "rsbuild" as const });
	},

	getSchemaFiles(validator, options, params) {
		return planSimpleSchemaFile(validator, options, params);
	},
};
