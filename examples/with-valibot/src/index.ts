import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

const env = arkenv(
	{
		TEST_VALUE: v.pipe(v.string(), v.url()),
		PORT: v.number(),
		HOST: v.union([
			v.literal("localhost"),
			v.pipe(v.string(), v.regex(/^[a-zA-Z0-9.-]+$/)),
		]),
		DEBUG: v.boolean(),
	},
	{
		toJsonSchema: (schema: unknown) =>
			toJsonSchema(schema as v.GenericSchema, {
				typeMode: "input",
				target: "draft-07",
			}),
	},
);

console.log(`Value: ${String(env.TEST_VALUE)}`);
console.log(`Type: ${typeof env.TEST_VALUE}`);
console.log("---");
console.log(env);
