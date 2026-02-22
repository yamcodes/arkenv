import arkenv from "arkenv/standard";
import z from "zod";

const env = arkenv({
	TEST_VALUE: z.url(),
	PORT: z.coerce.number(),
	HOST: z.literal("localhost").or(z.string().hostname()),
});

console.log(`Value: ${String(env.TEST_VALUE)}`);
console.log(`Type: ${typeof env.TEST_VALUE}`);
console.log("---");
console.log(env);
