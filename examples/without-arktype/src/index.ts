import { createEnv } from "arkenv";
import z from "zod";

// const env = createEnv({
// 	TEST_VALUE: z.url(),
// 	PORT: z.coerce.number(),
// 	HOST: z.literal("localhost").or(z.url()),
// });

const env = createEnv({
	TEST_VALUE: "string.url",
	PORT: "number",
	HOST: "'localhost' | string.url",
});

console.log(`Value: ${String(env.TEST_VALUE)}`);
console.log(`Type: ${typeof env.TEST_VALUE}`);
console.log("---");
console.log(env);
