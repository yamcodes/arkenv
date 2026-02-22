import { createEnv } from "arkenv/standard";
import z from "zod";

const env = createEnv({
	TEST_VALUE: z.url(),
	PORT: z.coerce.number(),
	HOST: z.literal("localhost").or(z.url()),
});

console.log(`Value: ${String(env.TEST_VALUE)}`);
console.log(`Type: ${typeof env.TEST_VALUE}`);
console.log("---");
console.log(env);
