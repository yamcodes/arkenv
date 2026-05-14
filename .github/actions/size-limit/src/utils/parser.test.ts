import { describe, expect, it } from "bun:test";
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

		expect(results).toHaveLength(3);

		expect(results[0]).toMatchObject({
			package: "arkenv",
			file: "arkenv",
			size: "1.77 kB",
			limit: "2 kB",
		});

		expect(results[1]).toMatchObject({
			package: "arkenv",
			file: "arkenv/standard",
			size: "1.03 kB",
			limit: "1.1 kB",
		});

		expect(results[2]).toMatchObject({
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

		expect(results).toHaveLength(1);
		expect(results[0].package).toBe("arkenv");
		expect(results[0].size).toBe("1 kB");
		expect(results.find((r) => r.package === "other-pkg")).toBeUndefined();
	});
});
