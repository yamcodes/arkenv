import { BringYourOwnValidatorView } from "./bring-your-own-validator-view";
import { highlightTs } from "./highlight-ts";

const EXAMPLES = [
	{
		id: "arktype" as const,
		label: "ArkType",
		importLine: "@arkenv/core",
		code: `import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string.url",
  PORT: "number.port",
});`,
	},
	{
		id: "zod" as const,
		label: "Zod",
		importLine: "@arkenv/standard",
		code: `import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().min(0).max(65535),
});`,
	},
	{
		id: "valibot" as const,
		label: "Valibot",
		importLine: "@arkenv/standard",
		code: `import arkenv from "@arkenv/standard";
import * as v from "valibot";

export const env = arkenv({
  DATABASE_URL: v.pipe(v.string(), v.url()),
  PORT: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(0), v.maxValue(65535)),
});`,
	},
];

/**
 * Pitch: same ArkEnv API across ArkType / Zod / Valibot via Standard Schema.
 */
export async function BringYourOwnValidator() {
	const examples = await Promise.all(
		EXAMPLES.map(async (example) => ({
			id: example.id,
			label: example.label,
			importLine: example.importLine,
			html: await highlightTs(example.code),
		})),
	);

	return <BringYourOwnValidatorView examples={examples} />;
}
