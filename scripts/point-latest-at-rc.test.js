import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	createTempNpmrcPath,
	distTagAddArgs,
	listPublishablePackageNames,
	parseArgs,
	parsePublishedPackages,
	pointLatestAtRc,
	resolveAuthToken,
	resolveOtp,
	runNpm,
	shouldRetagLatest,
	skipReasonForPre,
	withOtp,
	withUserconfig,
	writeNpmrcAuth,
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

describe("skipReasonForPre", () => {
	it("distinguishes missing file, exit mode, and wrong tag", () => {
		expect(skipReasonForPre(null)).toMatch(/pre\.json missing/);
		expect(skipReasonForPre({ mode: "exit", tag: "rc" })).toMatch(
			/mode is "exit"/,
		);
		expect(skipReasonForPre({ mode: "pre", tag: "alpha" })).toMatch(/not rc/);
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

describe("withUserconfig", () => {
	it("prefixes --userconfig when a path is provided", () => {
		expect(withUserconfig(["dist-tag", "ls"], "/tmp/x.npmrc")).toEqual([
			"--userconfig",
			"/tmp/x.npmrc",
			"dist-tag",
			"ls",
		]);
		expect(withUserconfig(["view", "arkenv"], undefined)).toEqual([
			"view",
			"arkenv",
		]);
	});
});

describe("withOtp", () => {
	it("appends --otp when a code is provided", () => {
		expect(
			withOtp(["dist-tag", "add", "arkenv@1.0.0-rc.1", "latest"], "123456"),
		).toEqual([
			"dist-tag",
			"add",
			"arkenv@1.0.0-rc.1",
			"latest",
			"--otp",
			"123456",
		]);
		expect(withOtp(["dist-tag", "ls"], "")).toEqual(["dist-tag", "ls"]);
		expect(withOtp(["dist-tag", "ls"], undefined)).toEqual(["dist-tag", "ls"]);
	});
});

describe("writeNpmrcAuth / createTempNpmrcPath", () => {
	it("writes auth to a dedicated path without needing ~/.npmrc", () => {
		const npmrcPath = createTempNpmrcPath();
		writeNpmrcAuth("npm_test_token", npmrcPath);
		expect(readFileSync(npmrcPath, "utf8")).toContain(
			"_authToken=npm_test_token",
		);
		expect(npmrcPath).not.toBe(join(tmpdir(), "..", ".npmrc"));
		expect(npmrcPath.includes("arkenv-npmrc-")).toBe(true);
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

describe("resolveOtp", () => {
	it("prefers options.otp over NPM_CONFIG_OTP", () => {
		expect(resolveOtp({ otp: "111111", env: { NPM_CONFIG_OTP: "222222" } })).toBe(
			"111111",
		);
		expect(resolveOtp({ env: { NPM_CONFIG_OTP: "222222" } })).toBe("222222");
		expect(resolveOtp({ otp: "  333333  ", env: {} })).toBe("333333");
		expect(resolveOtp({ env: {} })).toBe("");
	});
});

describe("parseArgs", () => {
	it("parses --packages and --dry-run", () => {
		expect(parseArgs(["--packages", "[]", "--dry-run"])).toEqual({
			packagesJson: "[]",
			fromRc: false,
			dryRun: true,
			local: false,
			help: false,
		});
	});

	it("parses --from-rc", () => {
		expect(parseArgs(["--from-rc"])).toEqual({
			fromRc: true,
			dryRun: false,
			local: false,
			help: false,
		});
	});

	it("parses --local", () => {
		expect(parseArgs(["--from-rc", "--local"])).toEqual({
			fromRc: true,
			dryRun: false,
			local: true,
			help: false,
		});
	});

	it("parses --otp", () => {
		expect(parseArgs(["--from-rc", "--local", "--otp", "123456"])).toEqual({
			fromRc: true,
			dryRun: false,
			local: true,
			otp: "123456",
			help: false,
		});
	});

	it("rejects --otp without a value", () => {
		expect(() => parseArgs(["--from-rc", "--otp"])).toThrow(
			/--otp requires a one-time password/,
		);
		expect(() => parseArgs(["--from-rc", "--otp", "--dry-run"])).toThrow(
			/--otp requires a one-time password/,
		);
	});

	it("ignores a bare -- separator (pnpm run-script)", () => {
		expect(parseArgs(["--from-rc", "--local", "--", "--dry-run"])).toEqual({
			fromRc: true,
			dryRun: true,
			local: true,
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

describe("runNpm", () => {
	it("inherits stdio for OTP-capable writes and does not trim null", () => {
		const exec = vi.fn(() => null);
		expect(
			runNpm(
				["dist-tag", "add", "arkenv@1.0.0-rc.1", "latest"],
				{
					inherit: true,
				},
				exec,
			),
		).toBe("");
		expect(exec).toHaveBeenCalledWith(
			"npm",
			["dist-tag", "add", "arkenv@1.0.0-rc.1", "latest"],
			{ stdio: "inherit" },
		);
	});

	it("captures and trims stdout for read commands", () => {
		const exec = vi.fn(() => "  yamcodes\n");
		expect(runNpm(["whoami"], {}, exec)).toBe("yamcodes");
		expect(exec).toHaveBeenCalledWith("npm", ["whoami"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
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

	it("skips when pre.json mode is exit (pre exit does not delete the file)", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "exit", tag: "rc" });
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
		expect(result.reason).toMatch(/mode is "exit"/);
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
		expect(result.reason).toMatch(/pnpm point-latest-at-rc/);
		expect(warn).toHaveBeenCalled();
	});

	it("local mode uses ambient npm auth without NPM_TOKEN or temp npmrc", () => {
		const { root } = makeRoot({ mode: "pre", tag: "rc" }, "");
		/** @type {{ args: string[]; opts?: { inherit?: boolean } }[]} */
		const calls = [];
		const log = vi.fn();
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			local: true,
			env: {},
			log,
			execNpm: (args, opts) => {
				calls.push({ args, opts });
				if (args[0] === "whoami") return "yamcodes";
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(result.npmrcPath).toBeUndefined();
		expect(calls).toEqual([
			{ args: ["whoami"], opts: undefined },
			{
				args: ["dist-tag", "add", "arkenv@1.0.0-rc.2", "latest"],
				opts: { inherit: true },
			},
		]);
		expect(log.mock.calls.flat().join("\n")).toMatch(/yamcodes/);
	});

	it("passes --otp on every local dist-tag write (single OTP for the run)", () => {
		const { root } = makeRoot({ mode: "pre", tag: "rc" }, "");
		/** @type {{ args: string[]; opts?: { inherit?: boolean } }[]} */
		const calls = [];
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson:
				'[{"name":"arkenv","version":"1.0.0-rc.2"},{"name":"@arkenv/core","version":"1.0.0-rc.2"}]',
			local: true,
			otp: "654321",
			env: {},
			execNpm: (args, opts) => {
				calls.push({ args, opts });
				if (args[0] === "whoami") return "yamcodes";
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(calls).toEqual([
			{ args: ["whoami"], opts: undefined },
			{
				args: [
					"dist-tag",
					"add",
					"arkenv@1.0.0-rc.2",
					"latest",
					"--otp",
					"654321",
				],
				opts: { inherit: true },
			},
			{
				args: [
					"dist-tag",
					"add",
					"@arkenv/core@1.0.0-rc.2",
					"latest",
					"--otp",
					"654321",
				],
				opts: { inherit: true },
			},
		]);
	});

	it("honors NPM_CONFIG_OTP when --otp is omitted", () => {
		const { root } = makeRoot({ mode: "pre", tag: "rc" }, "");
		/** @type {string[][]} */
		const writes = [];
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			local: true,
			env: { NPM_CONFIG_OTP: "998877" },
			execNpm: (args) => {
				if (args[0] === "whoami") return "yamcodes";
				writes.push(args);
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(writes).toEqual([
			["dist-tag", "add", "arkenv@1.0.0-rc.2", "latest", "--otp", "998877"],
		]);
	});

	it("CI token path does not inherit stdio for dist-tag writes", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "pre", tag: "rc" });
		/** @type {{ args: string[]; opts?: { inherit?: boolean } }[]} */
		const calls = [];
		const result = pointLatestAtRc({
			rootDir: root,
			packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
			env,
			npmrcPath,
			execNpm: (args, opts) => {
				calls.push({ args, opts });
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(calls).toEqual([
			{
				args: [
					"--userconfig",
					npmrcPath,
					"dist-tag",
					"add",
					"arkenv@1.0.0-rc.2",
					"latest",
				],
				opts: { inherit: false },
			},
		]);
	});

	it("local mode fails when npm whoami fails", () => {
		const { root } = makeRoot({ mode: "pre", tag: "rc" }, "");
		expect(() =>
			pointLatestAtRc({
				rootDir: root,
				packagesJson: '[{"name":"arkenv","version":"1.0.0-rc.2"}]',
				local: true,
				env: {},
				execNpm: (args) => {
					if (args[0] === "whoami") throw new Error("ENEEDAUTH");
					throw new Error("should not run");
				},
			}),
		).toThrow(/Local mode requires npm auth/);
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
			[
				"--userconfig",
				npmrcPath,
				"dist-tag",
				"add",
				"arkenv@1.0.0-rc.2",
				"latest",
			],
			[
				"--userconfig",
				npmrcPath,
				"dist-tag",
				"add",
				"@arkenv/core@1.0.0-rc.2",
				"latest",
			],
		]);
		expect(calls).toEqual([]);
		expect(log.mock.calls.flat().join("\n")).toMatch(/\[dry-run\]/);
	});

	it("runs npm dist-tag add via --userconfig temp auth (does not need ~/.npmrc)", () => {
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
		expect(calls).toEqual([
			[
				"--userconfig",
				npmrcPath,
				"dist-tag",
				"add",
				"arkenv@1.0.0-rc.2",
				"latest",
			],
		]);
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
			[
				"--userconfig",
				npmrcPath,
				"dist-tag",
				"add",
				"arkenv@1.0.0-rc.1",
				"latest",
			],
		]);
	});

	it("warns and skips packages without @rc instead of aborting --from-rc", () => {
		const { root, npmrcPath, env } = makeRoot({ mode: "pre", tag: "rc" });
		mkdirSync(join(root, "packages", "arkenv"), { recursive: true });
		mkdirSync(join(root, "packages", "missing"), { recursive: true });
		writeFileSync(
			join(root, "packages", "arkenv", "package.json"),
			JSON.stringify({ name: "arkenv", version: "1.0.0-rc.1" }),
		);
		writeFileSync(
			join(root, "packages", "missing", "package.json"),
			JSON.stringify({ name: "@arkenv/missing", version: "0.0.0" }),
		);
		const warn = vi.fn();
		const calls = [];
		const result = pointLatestAtRc({
			rootDir: root,
			fromRc: true,
			env,
			npmrcPath,
			warn,
			execNpm: (args) => {
				calls.push(args);
				if (args[0] === "view") {
					if (args[1] === "arkenv@rc") return "1.0.0-rc.1";
					throw new Error("404 Not Found - GET …/@arkenv/missing");
				}
				return "ok";
			},
		});
		expect(result.status).toBe("ok");
		expect(warn.mock.calls.flat().join("\n")).toMatch(/@arkenv\/missing/);
		expect(calls).toEqual([
			["view", "@arkenv/missing@rc", "version"],
			["view", "arkenv@rc", "version"],
			[
				"--userconfig",
				npmrcPath,
				"dist-tag",
				"add",
				"arkenv@1.0.0-rc.1",
				"latest",
			],
		]);
	});
});
