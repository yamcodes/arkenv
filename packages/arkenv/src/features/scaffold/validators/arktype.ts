import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";
import { arktypeTemplate } from "@/features/scaffold/templates";
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
			`DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
		],
		clientFields: [
			`${defaultClientKey}: "string = 'https://api.example.com'",`,
		],
		sharedFields: [
			`NODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
		],
		runtimeEnvFields: [
			`${defaultClientKey}: process.env.${defaultClientKey},`,
			"NODE_ENV: process.env.NODE_ENV,",
		],
	};
}

export const arktypeStrategy: ValidatorStrategy = {
	formatField(key, role) {
		if (role === "shared") {
			return `${key}: "'development' | 'production' | 'test' = 'development'",`;
		}
		if (role === "server" && key === "PORT") {
			return `PORT: "number.port = 3000",`;
		}
		return `${key}: "string?",`;
	},

	getSimpleTemplate(keys, context) {
		return `${arktypeTemplate(
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
				shared: `import { type } from "@arkenv/core";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = type(${formatSchemaObject(sharedFields, "\t")});`,

				clientCodegen: `import arkenv from "${clientImportPath}";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`,

				clientNoCodegen: `import arkenv from "${clientImportPath}";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions(runtimeEnvFields)}
	},
);`,

				server: `import arkenv from "${pkgName}/server";
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
