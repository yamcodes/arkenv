import arkenv, { type } from "arkenv";

// 1. Define the environment schema.
// ArkEnv automatically parses, coerces, and validates environment variables.
// By default, it uses ArkType's powerful DSL.
const env = arkenv(
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

// 2. Access variables with full typesafety and IDE autocomplete!
console.log("🚀 Environment variables validated successfully by ArkEnv!\n");

console.log("Validated Environment Configuration:");
console.log("-------------------------------------");
console.log(`NODE_ENV:    ${env.NODE_ENV} (${typeof env.NODE_ENV})`);
console.log(`HOST:        ${env.HOST} (${typeof env.HOST})`);
console.log(`PORT:        ${env.PORT} (${typeof env.PORT})`);
console.log(`DEBUGGING:   ${env.DEBUGGING} (${typeof env.DEBUGGING})`);
console.log(`SHINY:       ${env.SHINY} (${typeof env.SHINY})`);
console.log(`LLAMA_COUNT: ${env.LLAMA_COUNT} (${typeof env.LLAMA_COUNT})`);
console.log(`NICKNAME:    ${env.NICKNAME} (${typeof env.NICKNAME})`);
console.log(`FAVORITE_COLOR: ${env.FAVORITE_COLOR} (${typeof env.FAVORITE_COLOR})`);
console.log(
	`API_KEY:     ${env.API_KEY ?? "undefined"} (${typeof env.API_KEY})`,
);
console.log(
	`MY_ARRAY:    ${JSON.stringify(env.MY_ARRAY)} (isArray: ${Array.isArray(env.MY_ARRAY)})`,
);
console.log("-------------------------------------");
console.log(
	"Note: UNRELATED was stripped because onUndeclaredKey is set to 'delete'.",
);
console.log("Is UNRELATED in env? ", "UNRELATED" in env ? "yes" : "no");

export default env;
