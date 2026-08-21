import { env } from "./env";

console.log("Running server... in port", env.PORT);

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
console.log(
	`FAVORITE_COLOR: ${env.FAVORITE_COLOR} (${typeof env.FAVORITE_COLOR})`,
);
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
