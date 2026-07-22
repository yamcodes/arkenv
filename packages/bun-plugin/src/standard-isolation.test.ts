import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertPackageStandardIsolation } from "../../../scripts/standard-isolation.js";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("Standard Mode isolation", () => {
	it("keeps published /standard entries free of arktype and @arkenv/core", async () => {
		const { checked } = await assertPackageStandardIsolation(packageDir);

		expect(checked.length).toBeGreaterThan(0);
	}, 60_000);
});
