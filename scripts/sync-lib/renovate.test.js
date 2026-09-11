import { describe, expect, it } from "vitest";
import { generatedMatchFileNames } from "./renovate.js";

describe("generatedMatchFileNames", () => {
	it("omits the trailing comma from the final generated entry", () => {
		const block = generatedMatchFileNames(["basic", "with-vite-react"]);
		const entries = block
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.startsWith('"examples/'));

		expect(entries).toEqual([
			'"examples/basic/**",',
			'"examples/with-vite-react/**"',
		]);
	});

	it("omits the trailing comma from a single generated entry", () => {
		const block = generatedMatchFileNames(["basic"]);
		expect(block).toContain('"examples/basic/**"');
		expect(block).not.toContain('"examples/basic/**",');
	});
});
