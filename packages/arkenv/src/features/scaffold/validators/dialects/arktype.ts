import dedent from "dedent";
import type { Dialect } from "./types";
import { tryFormatPresetFieldValue } from "./types";

export const arktypeDialect: Dialect = {
	formatOptionalString() {
		return `"string?"`;
	},

	formatOptionalEnum(values) {
		return `"'${values.join("' | '")}'?"`;
	},

	formatStrictField(key, role, clientPrefix = "") {
		if (role === "shared") {
			return `${key}: "'development' | 'production' | 'test' = 'development'",`;
		}
		if (role === "server" && key === "PORT") {
			return `PORT: "number.port = 3000",`;
		}
		const preset = tryFormatPresetFieldValue(arktypeDialect, key, clientPrefix);
		if (preset) return `${key}: ${preset},`;
		return `${key}: "string?",`;
	},

	formatCodegenField(key, role, clientPrefix = "") {
		if (role === "shared") {
			return `${key}: "'development' | 'production' | 'test' = 'development'",`;
		}
		const preset = tryFormatPresetFieldValue(arktypeDialect, key, clientPrefix);
		if (preset) return `${key}: ${preset},`;
		return `${key}: "string?",`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",
		PORT: "number.port = 3000",`,

	formatSimpleSchemaFields(keys, clientPrefix = "") {
		return keys
			.map((key) => {
				const preset = tryFormatPresetFieldValue(
					arktypeDialect,
					key,
					clientPrefix,
				);
				return `\t\t${key}: ${preset ?? `"string?"`},`;
			})
			.join("\n");
	},

	getDefaultStrictFields(clientPrefix) {
		const defaultClientKey = `${clientPrefix}API_URL`;
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
	},

	getDefaultCodegenFields(clientPrefix) {
		return {
			serverFields: [
				`\t\tDATABASE_URL: "string = 'postgres://localhost:5432/mydb'",`,
			],
			clientFields: [
				`\t\t${clientPrefix}API_URL: "string = 'https://api.example.com'",`,
			],
			sharedFields: [
				`\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",`,
			],
		};
	},

	sharedImports: `import { type } from "@arkenv/core";`,

	wrapSharedSchema(schemaObject) {
		return `type(${schemaObject})`;
	},

	strictExtraImports: "",

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import arkenv, { type } from "@arkenv/core";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const Env = type({
${schemaFields}
	});

	export const env = arkenv(Env);
`;
	},

	pluginEnvImports: `import { type } from "@arkenv/core";`,
};
