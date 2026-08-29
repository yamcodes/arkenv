import { BringYourOwnValidatorView } from "./bring-your-own-validator-view";
import { highlightTwoslash } from "./highlight-hero-twoslash";

export const BYOV_CODE = `import arkenv from "@arkenv/core";
import * as z from "zod";
import * as v from "valibot";
// ---cut---
export const env = arkenv({
  NODE_ENV: "'development' | 'test' | 'production'",
  DATABASE_URL: v.pipe(v.string(), v.url()),
  DEBUG: z.boolean(),
});`;

const cut = "// ---cut---\n";

export const BYOV_VISIBLE = BYOV_CODE.includes(cut)
	? BYOV_CODE.slice(BYOV_CODE.indexOf(cut) + cut.length)
	: BYOV_CODE;

/**
 * Pitch: same ArkEnv API across ArkType, Zod, and Valibot — mixed in one schema.
 */
export async function BringYourOwnValidator() {
	const html = await highlightTwoslash(BYOV_CODE, "arktype");
	return <BringYourOwnValidatorView html={html} copyText={BYOV_VISIBLE} />;
}
