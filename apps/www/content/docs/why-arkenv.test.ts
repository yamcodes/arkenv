import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const whyArkEnv = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "why-arkenv.mdx"),
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
	const hosting = whyArkEnv
		.split("\n")
		.find((line) => line.includes("| **Hosting presets**"));

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

	it("lists hosting presets for ArkEnv init and T3 Env extends only", () => {
		const [, arkEnv, varlock, t3Env, vitePlugin, znv, envalid] = cells(hosting);
		expect(arkEnv).toBe("✅");
		expect(varlock).toBe("❌");
		expect(t3Env).toBe("✅");
		expect(vitePlugin).toBe("❌");
		expect(znv).toBe("❌");
		expect(envalid).toBe("❌");
		expect(whyArkEnv).toContain("`arkenv init --preset`");
		expect(whyArkEnv).toContain("/docs/core-concepts/hosting-presets");
		expect(whyArkEnv).not.toContain("arkenv add host");
	});
});
