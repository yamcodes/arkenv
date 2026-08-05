import { BeforeAfterCompareView } from "./before-after-compare-view";
import { highlightTs } from "./highlight-ts";

const BEFORE = `// The old way
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL missing");
if (!/^https?:\\/\\//.test(DATABASE_URL)) {
  throw new Error("DATABASE_URL must be http(s)");
}

const portRaw = process.env.PORT ?? "3000";
const PORT = Number.parseInt(portRaw, 10);
if (Number.isNaN(PORT)) throw new Error("PORT invalid");
if (PORT < 0 || PORT > 65535) {
  throw new Error("PORT out of range");
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
if (!["development", "production"].includes(NODE_ENV)) {
  throw new Error("NODE_ENV invalid");
}

export const env = { DATABASE_URL, PORT, NODE_ENV };`;

const AFTER = `// The ArkEnv way
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string.url",
  PORT: "0 <= number.integer <= 65535 = 3000",
  NODE_ENV: "'development' | 'production'",
});`;

function countLines(source: string) {
	return source.trimEnd().split("\n").length;
}

/**
 * Server entry: Shiki-highlights the snippets, then hands off to the
 * interactive client reveal.
 */
export async function BeforeAfterCompare() {
	const [beforeHtml, afterHtml] = await Promise.all([
		highlightTs(BEFORE),
		highlightTs(AFTER),
	]);

	const reduction = Math.round(
		(1 - countLines(AFTER) / countLines(BEFORE)) * 100,
	);

	return (
		<BeforeAfterCompareView
			beforeHtml={beforeHtml}
			afterHtml={afterHtml}
			reduction={reduction}
		/>
	);
}
