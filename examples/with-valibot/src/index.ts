import arkenv from "@arkenv/standard";
import * as v from "valibot";

const env = arkenv({
	TEST_VALUE: v.pipe(v.string(), v.url()),
	PORT: v.pipe(v.string(), v.transform(Number), v.number()),
	HOST: v.union([
		v.literal("localhost"),
		v.pipe(v.string(), v.regex(/^[a-z0-9.-]+$/i)),
	]),
});

console.log(`Value: ${String(env.TEST_VALUE)}`);
console.log(`Type: ${typeof env.TEST_VALUE}`);
console.log("---");
console.log(env);
