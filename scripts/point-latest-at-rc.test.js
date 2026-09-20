import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	distTagAddArgs,
	listPublishablePackageNames,
	parseArgs,
	parsePublishedPackages,
	pointLatestAtRc,
	resolveAuthToken,
	shouldRetagLatest,
} from "./point-latest-at-rc.js";

describe("shouldRetagLatest", () => {
	it("returns true only for pre mode with tag rc", () => {
		expect(shouldRetagLatest({ mode: "pre", tag: "rc" })).toBe(true);
		expect(shouldRetagLatest({ mode: "pre", tag: "alpha" })).toBe(false);
		expect(shouldRetagLatest({ mode: "exit", tag: "rc" })).toBe(false);
		expect(shouldRetagLatest(null)).toBe(false);
		expect(shouldRetagLatest(undefined)).toBe(false);
	});
});

describe("parsePublishedPackages", () => {
	it("parses changesets/action published-packages JSON", () => {
		expect(
			parsePublishedPackages(
				'[{"name":"arkenv","version":"1.0.0-rc.2"},{"name":"@arkenv/core","version":"1.0.0-rc.2"}]',
			),
		).toEqual([
			{ name: "arkenv", version: "1.0.0-rc.2" },
			{ name: "@arkenv/core", version: "1.0.0-rc.2" },
		]);
	});

	it("treats empty input as no packages", () => {
		expect(parsePublishedPackages("")).toEqual([]);
		expect(parsePublishedPackages("[]")).toEqual([]);
	});

	it("rejects invalid entries", () => {
		expect(() => parsePublishedPackages('[{"name":"arkenv"}]')).toThrow(
			/invalid published package entry/,
		);
		expect(() => parsePublishedPackages("{}")).toThrow(/JSON array/);
	});
});

describe("distTagAddArgs", () => {
	it("builds npm dist-tag add args for latest", () => {
		expect(distTagAddArgs("@arkenv/core", "1.0.0-rc.2")).toEqual([
			"dist-tag",
			"add",
			"@arkenv/core@1.0.0-rc.2",
			"latest",
		]);
	});
});

describe("resolveAuthToken", () => {
	it("prefers NODE_AUTH_TOKEN then NPM_TOKEN", () => {
		expect(resolveAuthToken({ NODE_AUTH_TOKEN: "a", NPM_TOKEN: "b" })).toBe(
			"a",
		);
		expect(resolveAuthToken({ NPM_TOKEN: "b" })).toBe("b");
		expect(resolveAuthToken({})).toBe("");
	});
});

describe("parseArgs", () => {
	it("parses --packages and --dry-run", () => {
		expect(parseArgs(["--packages", "[]", "--dry-run"])).toEqual({
			packagesJson: "[]",
			fromRc: false,
			dryRun: true,
			help: false,
		});
	});

	it("parses --from-rc", () => {
		expect(parseArgs(["--from-rc"])).toEqual({
			fromRc: true,
			dryRun: false,
			help: false,
		});
	});

	it("rejects combining --packages and --from-rc", () => {
		expect(() => parseArgs(["--packages", "[]", "--from-rc"])).toThrow(
			/either --packages or --from-rc/,
		);
	});
});

describe("listPublishablePackageNames", () => {
	it("skips private packages", () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-pkgs-"));
		mkdirSync(join(root, "packages", "core"), { recursive: true });
		mkdirSync(join(root, "packages", "internal"), { recursive: true });
		writeFileSync(
			join(root, "packages", "core", "package.json"),
			JSON.stringify({ name: "@arkenv/core", version: "1.0.0-rc.1" }),
		);
		writeFileSync(
			join(root, "packages", "internal", "package.json"),
			JSON.stringify({ name: "@repo/internal", private: true }),
		);
		expect(listPublishablePackageNames(root)).toEqual(["@arkenv/core"]);
	});
});

describe("pointLatestAtRc", () => {
	/**
	 * @param {{ tag?: string; mode?: string } | null} pre
	 * @param {string} [token]
	 */
	function makeRoot(pre, token = "npm_test_token") {
		const root = mkdtempSync(join(tmpdir(), "arkenv-retag-"));
		mkdirSync(join(root, ".changeset"), { recursive: true });
		if (pre) {
			writeFileSync(join(root, ".changeset", "pre.json"), JSON.stringify(pre));
		}
		const npmrcPath = join(root, ".npmrc");
		return {
			root,
			npmrcPath,
			env: token ? { NODE_AUTH_TOKEN: token } : {},
		};
	}

	it("skips when not in rc pre mode", () => {
		const { root, npmrcPath, env } = makeRoot(null);
		const log = vi.fn();
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			env,
			npmrcPath,
			log,
			execNpm: () => {
				throw new Error("should not run npm");
			},
		});
		expect(result.status).toBe("skipped");
		expect(result.reason).toMatch(/pre\.json missing/);
		expect(result.commands).toEqual([]);
	});

	it("skips soft when auth token is missing (OIDC cannot dist-tag)", () => {
		const { root, npmrcPath } = makeRoot({ mode: "pre", tag: "rc" }, "");
		const warn = vi.fn();
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			env: {},
			npmrcPath,
			warn,
			execNpm: () => {
				throw new Error("should not run npm");
			},
		});
		expect(result.status).toBe("skipped");
		expect(result.reason).toMatch(/NPM_TOKEN/);
		expect(result.reason).toMatch(/OIDC/);
		expect(warn).toHaveBeenCalled();
	});

	it("dry-runs dist-tag commands without calling npm add", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "pre", tag: "rc" });
		const calls = [];
		const log = vi.fn();
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson:
				'[{"name":"arkenv","version":"1.0.0-rc.2"},{"name":"@arkenv/core","version":"1.0.0-rc.2"}]',
			dryRun: true,
			env,
			npmrcPath,
			log,
			execNpm: (args) => {
				calls.push(args);
				return "";
			},
		});
		expect(result.status).toBe("ok");
		expect(result.commands).toEqual([
			["dist-tag", "add", "arkenv@1.0.0-rc.2", "latest"],
			["dist-tag", "add", "@arkenv/core@1.0.0-rc.2", "latest"],
		]);
		expect(calls).toEqual([]);
		expect(log.mock.calls.flat().join("\n")).toMatch(/\[dry-run\]/);
	});

	it("runs npm dist-tag add for each published package", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "pre", tag: "rc" });
		const calls = [];
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			env,
			npmrcPath,
			execNpm: (args) => {
				calls.push(args);
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(calls).toEqual([["dist-tag", "add", "arkenv@1.0.0-rc.2", "latest"]]);
		expect(readFileSync(npmrcPath, "utf8")).toContain(
			"_authToken=npm_test_token",
		);
	});

	it("resolves versions from @rc when --from-rc", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "pre", tag: "rc" });
		mkdirSync(join(root, "packages", "arkenv"), { recursive: true });
		writeFileSync(
			join(root, "packages", "arkenv", "package.json"),
			JSON.stringify({ name: "arkenv", version: "1.0.0-rc.1" }),
		);
		const calls = [];
		const result = pointLatestAtRc({
			rootDir: root,
			fromRc: true,
			env,
			npmrcPath,
			execNpm: (args) => {
				calls.push(args);
				if (args[0] === "view") return "1.0.0-rc.1";
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(calls).toEqual([
			["view", "arkenv@rc", "version"],
			["dist-tag", "add", "arkenv@1.0.0-rc.1", "latest"],
		]);
	});
});
