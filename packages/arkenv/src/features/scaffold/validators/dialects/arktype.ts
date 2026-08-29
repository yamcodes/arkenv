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

	formatCodegenField(key, role, clientPrefix = "", hostPreset = undefined) {
		if (role === "shared") {
			return `${key}: "'development' | 'production' | 'test' = 'development'",`;
		}
		const preset = tryFormatPresetFieldValue(
			arktypeDialect,
			key,
			clientPrefix,
			hostPreset,
		);
		if (preset) return `${key}: ${preset},`;
		return `${key}: "string?",`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: "'development' | 'production' | 'test' = 'development'",
		PORT: "number.port = 3000",`,

	formatSimpleSchemaFields(keys, clientPrefix = "", hostPreset = undefined) {
		return keys
			.map((key) => {
				const preset = tryFormatPresetFieldValue(
					arktypeDialect,
					key,
					clientPrefix,
					hostPreset,
				);
				return `\t\t${key}: ${preset ?? `"string?"`},`;
			})
			.join("\n");
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

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import arkenv, { type } from "@arkenv/core";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
${schemaFields}
	});
`;
	},
};
