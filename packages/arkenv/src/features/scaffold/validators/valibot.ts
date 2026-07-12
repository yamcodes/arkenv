import type { ScaffoldContext } from "../scaffold-context";
import { valibotTemplate } from "../templates";
import {
	assembleStrictTemplates,
	buildRuntimeEnvOptions,
	categorizeEnvKeys,
	formatSchemaObject,
	getClientImportPath,
	getFrameworkPackageName,
} from "./shared";
import type { ValidatorStrategy } from "./types";

function getDefaultStrictFields(context: ScaffoldContext) {
	const defaultClientKey = `${context.clientPrefix}API_URL`;
	return {
		serverFields: [
			`DATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
		],
		clientFields: [
			`${defaultClientKey}: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
		],
		sharedFields: [
			`NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
		],
		runtimeEnvFields: [
			`${defaultClientKey}: process.env.${defaultClientKey},`,
			"NODE_ENV: process.env.NODE_ENV,",
		],
	};
}

export const valibotStrategy: ValidatorStrategy = {
	formatField(key, role) {
		if (role === "shared") {
			return `${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`;
		}
		if (role === "server" && key === "PORT") {
			return "PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),";
		}
		return `${key}: v.optional(v.string()),`;
	},

	getSimpleTemplate(keys, context) {
		return `${valibotTemplate(
			keys.length > 0 ? keys : undefined,
			context.framework,
			context.nextjsImportPath,
			context.disableCodegen,
			context.layout,
		)}\n`;
	},

	getStrictTemplates(keys, context) {
		const pkgName = getFrameworkPackageName(context);
		const clientImportPath = getClientImportPath(context);
		const runtimeEnvOptions = (runtimeEnvFields: string[]) =>
			buildRuntimeEnvOptions(runtimeEnvFields, context);

		let serverFields: string[];
		let clientFields: string[];
		let sharedFields: string[];
		let runtimeEnvFields: string[];

		if (keys.length > 0) {
			({ serverFields, clientFields, sharedFields, runtimeEnvFields } =
				categorizeEnvKeys(keys, context, this.formatField));
		} else {
			({ serverFields, clientFields, sharedFields, runtimeEnvFields } =
				getDefaultStrictFields(context));
		}

		return assembleStrictTemplates(
			{
				shared: `import * as v from "valibot";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = v.object(${formatSchemaObject(sharedFields, "\t")});`,

				clientCodegen: `import arkenv from "${clientImportPath}";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`,

				clientNoCodegen: `import arkenv from "${clientImportPath}";
import * as v from "valibot";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions(runtimeEnvFields)}
	},
);`,

				server: `import arkenv from "${pkgName}/server";
import * as v from "valibot";
import { env as clientEnv } from "./client";

export const env = arkenv(
	${formatSchemaObject(serverFields, "\t\t")},
	{
		extends: [clientEnv],
	},
);`,
			},
			context,
		);
	},
};
