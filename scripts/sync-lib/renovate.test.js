import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generatedMatchFileNames } from "./renovate.js";
import { ROOT_DIR } from "./constants.js";

describe("generatedMatchFileNames", () => {
	it("adds a trailing comma to every generated entry", () => {
		const block = generatedMatchFileNames(["basic", "with-vite-react"]);
		const entries = block
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.startsWith('"examples/'));

		expect(entries).toEqual([
			'"examples/basic/**",',
			'"examples/with-vite-react/**",',
		]);
	});

	it("adds a trailing comma to a single generated entry", () => {
		const block = generatedMatchFileNames(["basic"]);
		expect(block).toContain('"examples/basic/**",');
	});
});

describe("Renovate configuration", () => {
	const config = readFileSync(join(ROOT_DIR, ".github", "renovate.json"), "utf8");

	it("includes every example in the pnpm group", () => {
		const pnpmGroupStart = config.indexOf('"groupName": "the pnpm group"');
		const generatedExamplesStart = config.indexOf(
			"// BEGIN GENERATED SYNC EXAMPLES",
		);
		const pnpmGroup = config.slice(pnpmGroupStart, generatedExamplesStart);

		expect(pnpmGroup).toContain('"examples/**"');
	});

	it("applies the generated-example exclusion after the pnpm group", () => {
		const pnpmGroupStart = config.indexOf('"groupName": "the pnpm group"');
		const generatedExamplesStart = config.indexOf(
			"// BEGIN GENERATED SYNC EXAMPLES",
		);

		expect(pnpmGroupStart).toBeGreaterThanOrEqual(0);
		expect(generatedExamplesStart).toBeGreaterThan(pnpmGroupStart);
	});
});
