import { describe, expect, it } from "vitest";
import { prereleaseChannel, transformPackageJson } from "./transform.js";
import { PublishedLookupError, parseCatalog } from "./workspace.js";

describe("transformPackageJson", () => {
	it("pins packageManager from the real workspace catalog", () => {
		const catalog = parseCatalog();
		expect(catalog.npm).toBeTruthy();
		expect(catalog.bun).toBeTruthy();

		const npmResult = transformPackageJson(
			{ name: "playground" },
			{ name: "basic", packageManager: "npm" },
			catalog,
		);
		expect(npmResult.packageManager).toBe(`npm@${catalog.npm}`);
		expect(npmResult.name).toBe("arkenv-example-basic");

		const bunResult = transformPackageJson(
			{ name: "playground" },
			{ name: "with-bun", packageManager: "bun" },
			catalog,
		);
		expect(bunResult.packageManager).toBe(`bun@${catalog.bun}`);
	});

	it("throws when missing from catalog", () => {
		const cfg = { name: "basic" };
		cfg["packageManager"] = "npm";
		expect(() => transformPackageJson({ name: "playground" }, cfg, {})).toThrow(
			/not found in workspace catalog/,
		);
	});

	it("pins prereleases to the published dist-tag, not unpublished workspace versions", () => {
		const lookups = [];
		const result = transformPackageJson(
			{
				name: "playground",
				dependencies: { "@arkenv/core": "workspace:*" },
			},
			{ name: "basic" },
			{},
			{
				getWorkspacePackageVersion: () => "1.0.0-rc.0",
				lookupPublished: (name, tag) => {
					lookups.push([name, tag]);
					return "1.0.0-rc.1";
				},
			},
		);
		expect(lookups).toEqual([["@arkenv/core", "rc"]]);
		expect(result.dependencies["@arkenv/core"]).toBe("1.0.0-rc.1");
	});

	it("adds a caret only for stable workspace versions", () => {
		const result = transformPackageJson(
			{
				name: "playground",
				dependencies: { "@arkenv/core": "workspace:*" },
			},
			{ name: "basic" },
			{},
			{
				getWorkspacePackageVersion: () => "1.0.0",
				lookupPublished: () => {
					throw new Error("stable versions must not hit the registry");
				},
			},
		);
		expect(result.dependencies["@arkenv/core"]).toBe("^1.0.0");
	});

	it("throws when the dist-tag lookup misses so check mode cannot fake drift", () => {
		expect(() =>
			transformPackageJson(
				{
					name: "playground",
					dependencies: { "@arkenv/core": "workspace:*" },
				},
				{ name: "basic" },
				{},
				{
					getWorkspacePackageVersion: () => "1.0.0-rc.0",
					lookupPublished: () => null,
				},
			),
		).toThrow(PublishedLookupError);
	});
});

describe("prereleaseChannel", () => {
	it("reads the npm dist-tag from a semver prerelease", () => {
		expect(prereleaseChannel("1.0.0-rc.0")).toBe("rc");
		expect(prereleaseChannel("1.0.0-alpha.10")).toBe("alpha");
		expect(prereleaseChannel("1.0.0-beta.1")).toBe("beta");
		expect(prereleaseChannel("1.0.0")).toBe(null);
	});
});
