import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "./package.json";

describe("www package scripts", () => {
	it("keeps next dev as the only long-lived process", () => {
		expect(packageJson.scripts.dev).toBe("next dev");
		expect(packageJson.scripts.dev).not.toContain("next-video");
		expect(packageJson.scripts.dev).not.toContain("conc");
	});

	it("exposes the documented one-shot next-video sync command", () => {
		expect(packageJson.scripts["video:sync"]).toBe("next-video sync");
		expect(packageJson.scripts["video:sync"]).not.toMatch(/-w|--watch/);
	});

	it("runs a one-shot next-video sync before next dev", () => {
		expect(packageJson.scripts.predev).toContain("video:sync");
		expect(packageJson.scripts.predev).not.toContain("next-video sync -w");
		expect(packageJson.scripts.predev).not.toContain("--watch");
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

	it("does not register a styled-jsx Babel transform", () => {
		const src = readFileSync(
			join(import.meta.dirname, "vitest.config.ts"),
			"utf8",
		);
		expect(src).not.toContain("styled-jsx");
		expect(src).not.toContain("plugin-babel");
		expect(src).not.toContain("@babel/core");
	});
});
