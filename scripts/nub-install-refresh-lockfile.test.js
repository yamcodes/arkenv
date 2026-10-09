import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	installRefreshingLockfile,
	isOutdatedLockfile,
	OUTDATED_LOCKFILE_CODE,
	OUTDATED_LOCKFILE_STATUS,
} from "./nub-install-refresh-lockfile.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("isOutdatedLockfile", () => {
	it("matches Nub's frozen-lockfile drift", () => {
		expect(
			isOutdatedLockfile({
				status: OUTDATED_LOCKFILE_STATUS,
				stderr: `${OUTDATED_LOCKFILE_CODE}\nmanifest says ^6.0.0, lockfile says ^3.1.10`,
			}),
		).toBe(true);
	});

	it("ignores other failures that happen to exit 16", () => {
		expect(
			isOutdatedLockfile({
				status: OUTDATED_LOCKFILE_STATUS,
				stderr: "something else failed",
			}),
		).toBe(false);
	});
});

describe("installRefreshingLockfile", () => {
	it("stops after a frozen install that succeeds", () => {
		const calls = [];
		const status = installRefreshingLockfile({
			run(args) {
				calls.push(args);
				return { status: 0, stdout: "", stderr: "" };
			},
		});
		expect(status).toBe(0);
		expect(calls).toEqual([["install"]]);
	});

	it("refreshes nub.lock when the frozen install reports drift", () => {
		const calls = [];
		const logs = [];
		const status = installRefreshingLockfile({
			log(line) {
				logs.push(line);
			},
			run(args) {
				calls.push(args);
				if (args.includes("--no-frozen-lockfile")) {
					return { status: 0, stdout: "updated", stderr: "" };
				}
				return {
					status: OUTDATED_LOCKFILE_STATUS,
					stdout: "",
					stderr: OUTDATED_LOCKFILE_CODE,
				};
			},
		});
		expect(status).toBe(0);
		expect(calls).toEqual([["install"], ["install", "--no-frozen-lockfile"]]);
		expect(logs.join("\n")).toMatch(/nub\.lock/);
	});

	it("returns the refresh status when the second install fails", () => {
		const status = installRefreshingLockfile({
			log() {},
			run(args) {
				if (args.includes("--no-frozen-lockfile")) return { status: 7 };
				return {
					status: OUTDATED_LOCKFILE_STATUS,
					stderr: OUTDATED_LOCKFILE_CODE,
				};
			},
		});
		expect(status).toBe(7);
	});

	it("does not refresh on an unrelated install failure", () => {
		const calls = [];
		const status = installRefreshingLockfile({
			run(args) {
				calls.push(args);
				return { status: 1, stderr: "registry down" };
			},
		});
		expect(status).toBe(1);
		expect(calls).toEqual([["install"]]);
	});

	it("returns 1 when Nub is killed before it can exit", () => {
		const status = installRefreshingLockfile({
			run() {
				return { status: null, stderr: "" };
			},
		});
		expect(status).toBe(1);
	});
});

describe("autofix workflow", () => {
	it("refreshes the lockfile before autofix commits", () => {
		const workflow = readFileSync(
			join(repoRoot, ".github/workflows/autofix.yml"),
			"utf8",
		);
		expect(workflow).toContain("node scripts/nub-install-refresh-lockfile.js");
		expect(workflow).not.toMatch(/run: nub install\n/);
	});
});
