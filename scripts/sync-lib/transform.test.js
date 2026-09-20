import { describe, expect, it } from "vitest";
import { prereleaseChannel, transformPackageJson } from "./transform.js";
import { PublishedLookupError } from "./workspace.js";

describe("transformPackageJson", () => {
	it("reads version from catalog", () => {
		const catalog = {};
		catalog["npm"] = "11.9.0";
		const cfg = { name: "basic" };
		cfg["packageManager"] = "npm";
		const result = transformPackageJson({ name: "playground" }, cfg, catalog);
		expect(result["packageManager"]).toBe("npm" + "@" + "11.9.0");
		expect(result.name).toBe("arkenv-example-basic");
	});

	it("sets bun from catalog", () => {
		const catalog = {};
		catalog["bun"] = "1.3.13";
		const cfg = { name: "with-bun" };
		cfg["packageManager"] = "bun";
		const result = transformPackageJson({ name: "playground" }, cfg, catalog);
		expect(result["packageManager"]).toBe("bun" + "@" + "1.3.13");
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
