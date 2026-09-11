import { describe, expect, it } from "vitest";
import { generatedMatchFileNames } from "./renovate.js";

describe("generatedMatchFileNames", () => {
	it("always trailing-commas generated entries so the region is self-contained", () => {
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

	it("trailing-commas a single generated entry", () => {
		const block = generatedMatchFileNames(["basic"]);
		expect(block).toContain('"examples/basic/**",');
		expect(block).not.toMatch(/"examples\/basic\/\*\*"\n/);
	});
});
