import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	FORBIDDEN_STANDARD_DEPS,
	getStandardExportEntries,
	isForbiddenStandardDep,
} from "./standard-isolation.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("standard-isolation helpers", () => {
	it("treats arktype and @arkenv/core as forbidden", () => {
		expect([...FORBIDDEN_STANDARD_DEPS]).toEqual(["arktype", "@arkenv/core"]);
		expect(isForbiddenStandardDep("arktype")).toBe(true);
		expect(isForbiddenStandardDep("@arkenv/core")).toBe(true);
		expect(isForbiddenStandardDep("@arkenv/core/utils")).toBe(true);
		expect(isForbiddenStandardDep("@arkenv/standard")).toBe(false);
	});

	it("discovers nested /standard exports from package.json", () => {
		const nextEntries = getStandardExportEntries(
			join(rootDir, "packages/nextjs"),
		);
		const exportPaths = nextEntries.map((entry) => entry.exportPath).sort();

		expect(exportPaths).toEqual([
			"./standard",
			"./standard/client",
			"./standard/config",
			"./standard/server",
			"./standard/shared",
		]);
	});
});
