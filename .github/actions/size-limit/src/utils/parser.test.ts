import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSizeLimitOutput } from "./parser.ts";

describe("parseSizeLimitOutput", () => {
	it("should correctly parse multiple entries for the same package", () => {
		const sampleOutput = `
arkenv:size: ✔ Adding to empty esbuild project
arkenv:size:   
arkenv:size:   arkenv
arkenv:size:   Size limit: 2 kB
arkenv:size:   Size:       1.77 kB with all dependencies, minified and brotlied
arkenv:size:   
arkenv:size:   arkenv/standard
arkenv:size:   Size limit: 1.1 kB
arkenv:size:   Size:       1.03 kB with all dependencies, minified and brotlied
arkenv:size:   
arkenv:size:   arkenv/core
arkenv:size:   Package size is 59 B less than limit
arkenv:size:   Size limit: 500 B
arkenv:size:   Size:       441 B with all dependencies, minified and brotlied
`;

		const relevantPackages = ["arkenv"];
		const results = parseSizeLimitOutput(sampleOutput, relevantPackages);

		assert.equal(results.length, 3);

		assert.partialDeepStrictEqual(results[0], {
			package: "arkenv",
			file: "arkenv",
			size: "1.77 kB",
			limit: "2 kB",
		});

		assert.partialDeepStrictEqual(results[1], {
			package: "arkenv",
			file: "arkenv/standard",
			size: "1.03 kB",
			limit: "1.1 kB",
		});

		assert.partialDeepStrictEqual(results[2], {
			package: "arkenv",
			file: "arkenv/core",
			size: "441 B",
			limit: "500 B",
		});
	});

	it("should handle mixed output and filter irrelevant packages", () => {
		const sampleOutput = `
arkenv:size: arkenv
arkenv:size: Size limit: 2 kB
arkenv:size: Size: 1 kB
other-pkg:size: other-pkg
other-pkg:size: Size limit: 5 kB
other-pkg:size: Size: 2 kB
`;
		const relevantPackages = ["arkenv"];
		const results = parseSizeLimitOutput(sampleOutput, relevantPackages);

		assert.equal(results.length, 1);
		assert.equal(results[0]?.package, "arkenv");
		assert.equal(results[0]?.size, "1 kB");
		assert.equal(
			results.find((result) => result.package === "other-pkg"),
			undefined,
		);
	});
});
