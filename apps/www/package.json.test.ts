import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import packageJson from "./package.json";

const lockfile = readFileSync(
	path.join(path.dirname(fileURLToPath(import.meta.url)), "../../nub.lock"),
	"utf8",
);

const resolvedSnapshots = (name: string) =>
	lockfile
		.split("\n")
		.filter(
			(line) =>
				line.startsWith(`  ${name}@`) &&
				line.includes("(") &&
				line.endsWith(":"),
		);

describe("www package scripts", () => {
	it("keeps next dev as the only long-lived process", () => {
		expect(packageJson.scripts.dev).toBe("next dev");
		expect(packageJson.scripts.dev).not.toContain("conc");
	});

	it("does not run a video pipeline before next dev", () => {
		expect(packageJson.scripts).not.toHaveProperty("video:sync");
		expect(packageJson.scripts.predev).not.toContain("video");
	});
});

describe("www Vitest dependency graph", () => {
	const deps = {
		...packageJson.dependencies,
		...packageJson.devDependencies,
	};

	it("does not depend on Babel or styled-jsx for tests", () => {
		expect(deps).not.toHaveProperty("@babel/core");
		expect(deps).not.toHaveProperty("@rolldown/plugin-babel");
		expect(deps).not.toHaveProperty("styled-jsx");
		expect(deps).not.toHaveProperty("babel-plugin-react-compiler");
	});

	it("keeps a single fumadocs graph after dropping www Babel", () => {
		expect(resolvedSnapshots("fumadocs-core")).toHaveLength(1);
		expect(resolvedSnapshots("fumadocs-ui")).toHaveLength(1);
	});
});
