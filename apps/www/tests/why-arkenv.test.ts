import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const page = readFileSync(
	join(
		dirname(fileURLToPath(import.meta.url)),
		"../content/docs/why-arkenv.mdx",
	),
	"utf8",
);

describe("Why ArkEnv comparison cheatsheet", () => {
	it("includes a Hosting presets row", () => {
		expect(page).toMatch(/\*\*Hosting presets\*\*/);
		expect(page).toMatch(
			/\|\s*\*\*Hosting presets\*\*\s*\|[^|]*✅[^|]*\|[^|]*❌[^|]*\|[^|]*✅/,
		);
	});
});
