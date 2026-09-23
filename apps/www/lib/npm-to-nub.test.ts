import { describe, expect, it } from "vitest";
import { convertNpmToNub } from "./npm-to-nub";

describe("convertNpmToNub", () => {
	it("maps npx runners to nubx", () => {
		expect(convertNpmToNub("npx arkenv init")).toBe("nubx arkenv init");
		expect(convertNpmToNub("npx --yes arkenv init")).toBe(
			"nubx --yes arkenv init",
		);
		expect(convertNpmToNub("npx @arkenv/agent-plugin init")).toBe(
			"nubx @arkenv/agent-plugin init",
		);
		expect(convertNpmToNub("npx skills add yamcodes/arkenv")).toBe(
			"nubx skills add yamcodes/arkenv",
		);
	});

	it("maps npm install with packages to nub add", () => {
		expect(convertNpmToNub("npm install @arkenv/core arktype")).toBe(
			"nub add @arkenv/core arktype",
		);
		expect(convertNpmToNub("npm install -D @arkenv/vite-plugin")).toBe(
			"nub add -D @arkenv/vite-plugin",
		);
		expect(convertNpmToNub("npm install -D arkenv")).toBe("nub add -D arkenv");
	});

	it("maps bare npm install to nub install", () => {
		expect(convertNpmToNub("npm install")).toBe("nub install");
		expect(convertNpmToNub("npm i")).toBe("nub install");
	});

	it("maps npm rm to nub remove", () => {
		expect(convertNpmToNub("npm rm @t3-oss/env-nextjs")).toBe(
			"nub remove @t3-oss/env-nextjs",
		);
		expect(convertNpmToNub("npm uninstall left-pad")).toBe(
			"nub remove left-pad",
		);
	});

	it("converts multi-line install fences", () => {
		expect(
			convertNpmToNub(
				"npm install @arkenv/core arktype\nnpm install -D @arkenv/vite-plugin",
			),
		).toBe("nub add @arkenv/core arktype\nnub add -D @arkenv/vite-plugin");
	});

	it("maps npm run / exec to nub run / exec", () => {
		expect(convertNpmToNub("npm run build")).toBe("nub run build");
		expect(convertNpmToNub("npm exec eslint .")).toBe("nub exec eslint .");
	});
});
