import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const whyArkEnv = readFileSync(
	join(import.meta.dirname, "../content/docs/why-arkenv.mdx"),
	"utf8",
);

/**
 * Split a markdown table row into trimmed cells.
 *
 * @param row Pipe-delimited table line
 */
function cells(row: string | undefined) {
	if (!row) {
		throw new Error("missing comparison table row");
	}
	return row
		.split("|")
		.map((cell) => cell.trim())
		.filter(Boolean);
}

describe("why-arkenv comparison cheatsheet", () => {
	const header = whyArkEnv
		.split("\n")
		.find((line) => line.includes("| **ArkEnv** |"));

	it("keeps the v1 competitor columns", () => {
		expect(cells(header)).toEqual([
			"Feature",
			"**ArkEnv**",
			"Varlock",
			"T3 Env",
			"vite-plugin-validate-env",
			"znv",
			"Envalid",
		]);
	});

	it("does not list hosting presets in the comparison table", () => {
		expect(whyArkEnv).not.toContain("| **Hosting presets**");
		expect(whyArkEnv).not.toContain("arkenv add host");
	});
});
