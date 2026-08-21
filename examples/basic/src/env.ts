import arkenv, { type } from "@arkenv/core";

// 1. Define the environment schema.
// ArkEnv automatically parses, coerces, and validates environment variables.
// By default, it uses ArkType's powerful DSL.
export const env = arkenv(
	{
		// Standard string union with a default value
		NODE_ENV: "'development' | 'production' | 'test' = 'development'",

		// Custom ArkEnv network types for host and port validation
		HOST: "string.host = 'localhost'",
		PORT: "number.port = 3000",

		// Automatic string-to-boolean coercion
		DEBUGGING: "boolean = false",
		SHINY: "boolean = false",

		// Automatic string-to-number coercion
		LLAMA_COUNT: "number.integer = 0",

		// Basic string variable
		NICKNAME: "string = 'anonymous'",

		// String union constraint
		FAVORITE_COLOR: "'red' | 'blue' | 'green' = 'red'",

		// Optional variable using a union type
		API_KEY: "string | undefined",

		// Parsing arrays (e.g. from JSON formatted lists)
		MY_ARRAY: type("(number | boolean)[]").default(() => []),
	},
	{
		// Enable array parsing from JSON strings
		arrayFormat: "json",
		// Automatically strip undeclared keys from the output object
		onUndeclaredKey: "delete",
	},
);
