import { describe, expect, it } from "vitest";
import { compareSemver, parseSemver } from "./semver";

describe("semver", () => {
	describe("parseSemver", () => {
		it("parses normal semver versions", () => {
			expect(parseSemver("1.2.3")).toEqual({
				major: 1,
				minor: 2,
				patch: 3,
				prerelease: [],
				build: undefined,
			});
			expect(parseSemver("v0.5.4")).toEqual({
				major: 0,
				minor: 5,
				patch: 4,
				prerelease: [],
				build: undefined,
			});
		});

		it("parses versions with pre-release identifiers and build metadata", () => {
			expect(parseSemver("1.0.0-beta.2+exp.sha.5114f85")).toEqual({
				major: 1,
				minor: 0,
				patch: 0,
				prerelease: ["beta", 2],
				build: "exp.sha.5114f85",
			});
		});

		it("parses short version strings", () => {
			expect(parseSemver("22")).toEqual({
				major: 22,
				minor: 0,
				patch: 0,
				prerelease: [],
				build: undefined,
			});
			expect(parseSemver("v5.1")).toEqual({
				major: 5,
				minor: 1,
				patch: 0,
				prerelease: [],
				build: undefined,
			});
		});

		it("returns null for invalid versions", () => {
			expect(parseSemver("invalid")).toBeNull();
			expect(parseSemver("")).toBeNull();
		});
	});

	describe("compareSemver", () => {
		it("compares major, minor, patch versions", () => {
			expect(compareSemver("1.0.0", "2.0.0")).toBe(-1);
			expect(compareSemver("2.0.0", "1.0.0")).toBe(1);
			expect(compareSemver("1.1.0", "1.2.0")).toBe(-1);
			expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
			expect(compareSemver("0.5.4", "0.5.5")).toBe(-1);
			expect(compareSemver("0.5.5", "0.5.4")).toBe(1);
		});

		it("handles pre-release precedence over normal release", () => {
			// Normal release has higher precedence than pre-release
			expect(compareSemver("1.0.0-alpha", "1.0.0")).toBe(-1);
			expect(compareSemver("1.0.0", "1.0.0-alpha")).toBe(1);
		});

		it("compares pre-release versions with numeric segments accurately", () => {
			// 1.0.0-beta.2 < 1.0.0-beta.11 (numeric segment comparison)
			expect(compareSemver("1.0.0-beta.2", "1.0.0-beta.11")).toBe(-1);
			expect(compareSemver("1.0.0-beta.11", "1.0.0-beta.2")).toBe(1);
			expect(compareSemver("1.0.0-beta.1", "1.0.0-beta.2")).toBe(-1);
		});

		it("compares alphanumeric pre-release identifiers", () => {
			// 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
			expect(compareSemver("1.0.0-alpha", "1.0.0-alpha.1")).toBe(-1);
			expect(compareSemver("1.0.0-alpha.1", "1.0.0-alpha.beta")).toBe(-1);
			expect(compareSemver("1.0.0-alpha.beta", "1.0.0-beta")).toBe(-1);
			expect(compareSemver("1.0.0-beta", "1.0.0-beta.2")).toBe(-1);
			expect(compareSemver("1.0.0-beta.2", "1.0.0-beta.11")).toBe(-1);
			expect(compareSemver("1.0.0-beta.11", "1.0.0-rc.1")).toBe(-1);
			expect(compareSemver("1.0.0-rc.1", "1.0.0")).toBe(-1);
		});

		it("ignores build metadata in precedence comparison", () => {
			expect(compareSemver("1.0.0+build1", "1.0.0+build2")).toBe(0);
			expect(compareSemver("1.0.0-alpha+001", "1.0.0-alpha+exp")).toBe(0);
		});

		it("handles leading 'v' prefix", () => {
			expect(compareSemver("v1.0.0", "1.0.0")).toBe(0);
			expect(compareSemver("v0.5.4", "v0.5.5")).toBe(-1);
		});
	});
});
