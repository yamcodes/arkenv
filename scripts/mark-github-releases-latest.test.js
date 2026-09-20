import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	isSemverPrerelease,
	listWorkspacePrereleasePackages,
	markGithubReleasesLatest,
	parseArgs,
	parseRepository,
	pickLatestReleasePackage,
	releaseTagName,
	shouldMarkGithubReleasesLatest,
	skipReasonForGithubLatest,
} from "./mark-github-releases-latest.js";

describe("shouldMarkGithubReleasesLatest", () => {
	it("returns true for any Changesets pre mode tag", () => {
		expect(shouldMarkGithubReleasesLatest({ mode: "pre", tag: "rc" })).toBe(
			true,
		);
		expect(shouldMarkGithubReleasesLatest({ mode: "pre", tag: "alpha" })).toBe(
			true,
		);
		expect(shouldMarkGithubReleasesLatest({ mode: "exit", tag: "rc" })).toBe(
			false,
		);
		expect(shouldMarkGithubReleasesLatest(null)).toBe(false);
	});
});

describe("skipReasonForGithubLatest", () => {
	it("distinguishes missing file and exit mode", () => {
		expect(skipReasonForGithubLatest(null)).toMatch(/pre\.json missing/);
		expect(skipReasonForGithubLatest({ mode: "exit", tag: "rc" })).toMatch(
			/mode is "exit"/,
		);
	});
});

describe("releaseTagName / isSemverPrerelease", () => {
	it("builds changesets-style tags and detects prereleases", () => {
		expect(releaseTagName("arkenv", "1.0.0-rc.1")).toBe("arkenv@1.0.0-rc.1");
		expect(releaseTagName("@arkenv/core", "1.0.0-rc.1")).toBe(
			"@arkenv/core@1.0.0-rc.1",
		);
		expect(isSemverPrerelease("1.0.0-rc.1")).toBe(true);
		expect(isSemverPrerelease("1.0.0")).toBe(false);
	});
});

describe("pickLatestReleasePackage", () => {
	it("prefers arkenv, then @arkenv/core", () => {
		expect(
			pickLatestReleasePackage([
				{ name: "@arkenv/core", version: "1.0.0-rc.1" },
				{ name: "arkenv", version: "1.0.0-rc.1" },
				{ name: "@arkenv/nextjs", version: "1.0.0-rc.1" },
			]),
		).toEqual({ name: "arkenv", version: "1.0.0-rc.1" });

		expect(
			pickLatestReleasePackage([
				{ name: "@arkenv/nextjs", version: "1.0.0-rc.1" },
				{ name: "@arkenv/core", version: "1.0.0-rc.1" },
			]),
		).toEqual({ name: "@arkenv/core", version: "1.0.0-rc.1" });
	});

	it("ignores stable versions", () => {
		expect(
			pickLatestReleasePackage([{ name: "arkenv", version: "1.0.0" }]),
		).toBeNull();
	});
});

describe("parseRepository", () => {
	it("splits owner/repo", () => {
		expect(parseRepository("yamcodes/arkenv")).toEqual({
			owner: "yamcodes",
			repo: "arkenv",
		});
		expect(() => parseRepository("invalid")).toThrow(/owner\/repo/);
	});
});

describe("listWorkspacePrereleasePackages", () => {
	it("lists non-private packages with SemVer prerelease versions", () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-gh-latest-"));
		mkdirSync(join(root, "packages", "arkenv"), { recursive: true });
		mkdirSync(join(root, "packages", "core"), { recursive: true });
		mkdirSync(join(root, "packages", "private-pkg"), { recursive: true });
		writeFileSync(
			join(root, "packages", "arkenv", "package.json"),
			JSON.stringify({ name: "arkenv", version: "1.0.0-rc.1" }),
		);
		writeFileSync(
			join(root, "packages", "core", "package.json"),
			JSON.stringify({ name: "@arkenv/core", version: "1.0.0" }),
		);
		writeFileSync(
			join(root, "packages", "private-pkg", "package.json"),
			JSON.stringify({
				name: "@arkenv/private",
				version: "1.0.0-rc.1",
				private: true,
			}),
		);

		expect(listWorkspacePrereleasePackages(root)).toEqual([
			{ name: "arkenv", version: "1.0.0-rc.1" },
		]);
	});
});

describe("parseArgs", () => {
	it("parses packages, from-workspace, and dry-run", () => {
		expect(parseArgs(["--packages", "[]", "--dry-run"])).toEqual({
			packagesJson: "[]",
			fromWorkspace: false,
			dryRun: true,
			help: false,
		});
		expect(parseArgs(["--from-workspace"])).toEqual({
			fromWorkspace: true,
			dryRun: false,
			help: false,
		});
		expect(() => parseArgs(["--packages", "[]", "--from-workspace"])).toThrow(
			/not both/,
		);
	});
});

describe("markGithubReleasesLatest", () => {
	it("skips when not in pre mode", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-gh-latest-"));
		mkdirSync(join(root, ".changeset"), { recursive: true });
		writeFileSync(
			join(root, ".changeset", "pre.json"),
			JSON.stringify({ mode: "exit", tag: "rc" }),
		);

		const result = await markGithubReleasesLatest({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.1"}]',
			dryRun: true,
			log: vi.fn(),
		});
		expect(result.status).toBe("skipped");
		expect(result.reason).toMatch(/mode is "exit"/);
	});

	it("dry-runs preferred make_latest on arkenv", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-gh-latest-"));
		mkdirSync(join(root, ".changeset"), { recursive: true });
		writeFileSync(
			join(root, ".changeset", "pre.json"),
			JSON.stringify({ mode: "pre", tag: "rc" }),
		);

		const logs = /** @type {string[]} */ ([]);
		const result = await markGithubReleasesLatest({
			rootDir: root,
			packagesJson:
				'[{"name":"@arkenv/core","version":"1.0.0-rc.1"},{"name":"arkenv","version":"1.0.0-rc.1"}]',
			dryRun: true,
			log: (message) => logs.push(message),
		});

		expect(result.status).toBe("ok");
		expect(result.updates).toEqual([
			{ tag: "@arkenv/core@1.0.0-rc.1", makeLatest: "false" },
			{ tag: "arkenv@1.0.0-rc.1", makeLatest: "true" },
		]);
		expect(logs.some((line) => line.includes("make_latest=true"))).toBe(true);
	});

	it("PATCHes releases with prerelease false and make_latest", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-gh-latest-"));
		mkdirSync(join(root, ".changeset"), { recursive: true });
		writeFileSync(
			join(root, ".changeset", "pre.json"),
			JSON.stringify({ mode: "pre", tag: "rc" }),
		);

		/** @type {{ url: string; method?: string; body?: string }[]} */
		const calls = [];
		const fetchImpl = vi.fn(async (url, init = {}) => {
			const method = init.method ?? "GET";
			calls.push({
				url: String(url),
				method,
				body: typeof init.body === "string" ? init.body : undefined,
			});
			if (method === "GET") {
				return {
					ok: true,
					async json() {
						return {
							id: 42,
							tag_name: "arkenv@1.0.0-rc.1",
							prerelease: true,
						};
					},
					async text() {
						return "";
					},
				};
			}
			return {
				ok: true,
				async json() {
					return {};
				},
				async text() {
					return "";
				},
			};
		});

		const result = await markGithubReleasesLatest({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.1"}]',
			env: {
				GITHUB_TOKEN: "test-token",
				GITHUB_REPOSITORY: "yamcodes/arkenv",
			},
			fetchImpl: /** @type {typeof fetch} */ (fetchImpl),
			log: vi.fn(),
		});

		expect(result.status).toBe("ok");
		expect(calls).toHaveLength(2);
		expect(calls[0]?.url).toContain("/releases/tags/arkenv%401.0.0-rc.1");
		expect(calls[1]?.method).toBe("PATCH");
		expect(JSON.parse(calls[1]?.body ?? "{}")).toEqual({
			prerelease: false,
			make_latest: "true",
		});
	});

	it("soft-skips when GITHUB_TOKEN is missing", async () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-gh-latest-"));
		mkdirSync(join(root, ".changeset"), { recursive: true });
		writeFileSync(
			join(root, ".changeset", "pre.json"),
			JSON.stringify({ mode: "pre", tag: "rc" }),
		);

		const warn = vi.fn();
		const result = await markGithubReleasesLatest({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.1"}]',
			env: {},
			warn,
			log: vi.fn(),
		});
		expect(result.status).toBe("skipped");
		expect(result.reason).toMatch(/GITHUB_TOKEN/);
		expect(warn).toHaveBeenCalled();
	});
});
