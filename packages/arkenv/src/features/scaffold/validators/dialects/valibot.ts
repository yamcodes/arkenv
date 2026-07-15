import dedent from "dedent";
import type { Dialect } from "./types";

export const valibotDialect: Dialect = {
	extraImport: `import * as v from "valibot";`,

	formatStrictField(key, role) {
		if (role === "shared") {
			return `${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`;
		}
		if (role === "server" && key === "PORT") {
			return "PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),";
		}
		return `${key}: v.optional(v.string()),`;
	},

	formatCodegenField(key, role) {
		if (role === "shared") {
			return `${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`;
		}
		return `${key}: v.optional(v.string()),`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
		PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),`,

	formatSimpleSchemaFields(keys) {
		return keys.map((key) => `\t\t${key}: v.optional(v.string()),`).join("\n");
	},

	getDefaultStrictFields(clientPrefix) {
		const defaultClientKey = `${clientPrefix}API_URL`;
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
	},

	getDefaultCodegenFields(clientPrefix) {
		return {
			serverFields: [
				`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			],
			clientFields: [
				`\t\t${clientPrefix}API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			],
			sharedFields: [
				`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			],
		};
	},

	sharedImports: `import * as v from "valibot";`,

	wrapSharedSchema(schemaObject) {
		return `v.object(${schemaObject})`;
	},

	strictExtraImports: `import * as v from "valibot";\n`,

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import arkenv from "@arkenv/standard";
	import * as v from "valibot";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
	},

	pluginEnvImports: `import { type } from "@arkenv/core";
import * as v from "valibot";`,
};
