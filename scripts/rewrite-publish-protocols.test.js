import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	collectWorkspacePackages,
	readWorkspaceCatalog,
	readWorkspacePackageGlobs,
	restorePackageJsonSnapshots,
	rewriteDependencySpec,
	rewritePackageJsonProtocols,
	rewriteWorkspacePackageJsons,
} from "./rewrite-publish-protocols.js";

describe("readWorkspacePackageGlobs", () => {
	it("reads Nub workspaces.packages", () => {
		expect(
			readWorkspacePackageGlobs({
				workspaces: { packages: ["packages/*", "apps/*"] },
			}),
		).toEqual(["packages/*", "apps/*"]);
	});

	it("rejects missing packages", () => {
		expect(() => readWorkspacePackageGlobs({})).toThrow(/workspaces\.packages/);
	});
});

describe("readWorkspaceCatalog", () => {
	it("returns empty object when catalog is absent", () => {
		expect(
			readWorkspaceCatalog({ workspaces: { packages: ["packages/*"] } }),
		).toEqual({});
	});

	it("reads catalog pins", () => {
		expect(
			readWorkspaceCatalog({
				workspaces: {
					packages: ["packages/*"],
					catalog: { jiti: "2.7.0", typescript: "5.0.0" },
				},
			}),
		).toEqual({ jiti: "2.7.0", typescript: "5.0.0" });
	});
});

describe("rewriteDependencySpec", () => {
	const ctx = {
		versions: new Map([
			["@arkenv/build", "1.0.0-rc.2"],
			["@arkenv/core", "1.0.0-rc.2"],
		]),
		catalog: { jiti: "2.7.0", typescript: "6.0.3" },
	};

	it("rewrites workspace:* to the exact workspace version", () => {
		expect(rewriteDependencySpec("@arkenv/build", "workspace:*", ctx)).toBe(
			"1.0.0-rc.2",
		);
	});

	it("rewrites catalog: to the exact catalog pin", () => {
		expect(rewriteDependencySpec("jiti", "catalog:", ctx)).toBe("2.7.0");
	});

	it("passes through normal semver ranges", () => {
		expect(rewriteDependencySpec("chokidar", "^4.0.3", ctx)).toBe("^4.0.3");
	});

	it("keeps explicit workspace ranges", () => {
		expect(rewriteDependencySpec("@arkenv/core", "workspace:^1.0.0", ctx)).toBe(
			"^1.0.0",
		);
	});

	it("throws when workspace target is unknown", () => {
		expect(() =>
			rewriteDependencySpec("@missing/pkg", "workspace:*", ctx),
		).toThrow(/not a workspace package/);
	});

	it("throws when catalog entry is missing", () => {
		expect(() => rewriteDependencySpec("missing", "catalog:", ctx)).toThrow(
			/missing from workspaces\.catalog/,
		);
	});
});

describe("rewritePackageJsonProtocols", () => {
	it("rewrites all dependency fields", () => {
		const ctx = {
			versions: new Map([["@arkenv/build", "1.0.0-rc.2"]]),
			catalog: { jiti: "2.7.0", typescript: "6.0.3" },
		};
		const { pkg, changed } = rewritePackageJsonProtocols(
			{
				name: "@arkenv/nextjs",
				dependencies: {
					"@arkenv/build": "workspace:*",
					jiti: "catalog:",
					chokidar: "^4.0.3",
				},
				devDependencies: {
					typescript: "catalog:",
				},
				peerDependencies: {
					"@arkenv/core": "^1.0.0",
				},
			},
			ctx,
		);
		expect(changed).toBe(true);
		expect(pkg.dependencies).toEqual({
			"@arkenv/build": "1.0.0-rc.2",
			jiti: "2.7.0",
			chokidar: "^4.0.3",
		});
		expect(pkg.devDependencies).toEqual({ typescript: "6.0.3" });
		expect(pkg.peerDependencies).toEqual({ "@arkenv/core": "^1.0.0" });
	});

	it("reports unchanged when no protocols present", () => {
		const { changed } = rewritePackageJsonProtocols(
			{ name: "x", dependencies: { chokidar: "^4.0.3" } },
			{ versions: new Map(), catalog: {} },
		);
		expect(changed).toBe(false);
	});
});

describe("rewriteWorkspacePackageJsons", () => {
	it("rewrites and restores package.json files on disk", () => {
		const root = mkdtempSync(join(tmpdir(), "rewrite-publish-"));
		mkdirSync(join(root, "packages", "build"), { recursive: true });
		mkdirSync(join(root, "packages", "nextjs"), { recursive: true });

		writeFileSync(
			join(root, "package.json"),
			JSON.stringify({
				name: "tmp",
				workspaces: {
					packages: ["packages/*"],
					catalog: { jiti: "2.7.0" },
				},
			}),
		);
		writeFileSync(
			join(root, "packages", "build", "package.json"),
			`${JSON.stringify(
				{
					name: "@arkenv/build",
					version: "1.0.0-rc.2",
					dependencies: { jiti: "catalog:" },
				},
				null,
				"\t",
			)}\n`,
		);
		const nextjsPath = join(root, "packages", "nextjs", "package.json");
		const nextjsOriginal = `${JSON.stringify(
			{
				name: "@arkenv/nextjs",
				version: "1.0.0-rc.2",
				dependencies: {
					"@arkenv/build": "workspace:*",
					jiti: "catalog:",
				},
			},
			null,
			"\t",
		)}\n`;
		writeFileSync(nextjsPath, nextjsOriginal);

		const byName = collectWorkspacePackages(root, ["packages/*"]);
		expect(byName.get("@arkenv/build")?.version).toBe("1.0.0-rc.2");

		const snapshots = rewriteWorkspacePackageJsons(root);
		expect(snapshots.length).toBeGreaterThanOrEqual(1);

		const rewritten = JSON.parse(readFileSync(nextjsPath, "utf8"));
		expect(rewritten.dependencies).toEqual({
			"@arkenv/build": "1.0.0-rc.2",
			jiti: "2.7.0",
		});

		restorePackageJsonSnapshots(snapshots);
		expect(readFileSync(nextjsPath, "utf8")).toBe(nextjsOriginal);
	});
});
