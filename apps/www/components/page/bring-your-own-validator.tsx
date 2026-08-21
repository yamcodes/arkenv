import { BringYourOwnValidatorView } from "./bring-your-own-validator-view";
import type { HeroTwoslashEngine } from "./hero-mvp-twoslash-options";
import { highlightTwoslash } from "./highlight-hero-twoslash";

export const BYOV_EXAMPLES = [
	{
		id: "arktype" as const,
		label: "ArkType",
		importLine: "@arkenv/core",
		code: `import arkenv from "@arkenv/core";

export const env = arkenv({
  NODE_ENV: "'development' | 'test' | 'production' = 'development'",
  DATABASE_URL: "string.url",
  LOG_LEVEL: "'debug' | 'info' | 'warn' | 'error' = 'info'",
});`,
	},
	{
		id: "zod" as const,
		label: "Zod",
		importLine: "@arkenv/standard",
		code: `import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});`,
	},
	{
		id: "valibot" as const,
		label: "Valibot",
		importLine: "@arkenv/standard",
		code: `import arkenv from "@arkenv/standard";
import * as v from "valibot";

export const env = arkenv({
  NODE_ENV: v.optional(v.picklist(["development", "test", "production"]), "development"),
  DATABASE_URL: v.pipe(v.string(), v.url()),
  LOG_LEVEL: v.optional(v.picklist(["debug", "info", "warn", "error"]), "info"),
});`,
	},
];

function twoslashEngine(
	id: (typeof BYOV_EXAMPLES)[number]["id"],
): HeroTwoslashEngine {
	return id === "arktype" ? "arktype" : "standard";
}

/**
 * Pitch: same ArkEnv API across ArkType / Zod / Valibot via Standard Schema.
 */
export async function BringYourOwnValidator() {
	const examples = await Promise.all(
		BYOV_EXAMPLES.map(async (example) => ({
			id: example.id,
			label: example.label,
			importLine: example.importLine,
			html: await highlightTwoslash(example.code, twoslashEngine(example.id)),
		})),
	);

	return <BringYourOwnValidatorView examples={examples} />;
}
