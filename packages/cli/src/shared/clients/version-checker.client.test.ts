import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VersionCheckerClient } from "./version-checker.client";

describe("VersionCheckerClient", () => {
	let client: VersionCheckerClient;
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		client = new VersionCheckerClient();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("returns isOutdated: true when registry version is newer", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ version: "0.6.0" }),
		} as Response);

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({
			isOutdated: true,
			latestVersion: "0.6.0",
		});
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"https://registry.npmjs.org/%40arkenv%2Fcli/latest",
			expect.objectContaining({
				headers: { Accept: "application/json" },
			}),
		);
	});

	it("returns isOutdated: false when current version is equal to or newer than registry", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ version: "0.5.4" }),
		} as Response);

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({
			isOutdated: false,
			latestVersion: "0.5.4",
		});
	});

	it("handles pre-release versions accurately", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ version: "1.0.0-beta.11" }),
		} as Response);

		const result = await client.checkFreshness({
			currentVersion: "1.0.0-beta.2",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({
			isOutdated: true,
			latestVersion: "1.0.0-beta.11",
		});
	});

	it("fails open silently when fetch returns non-200 status", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
		} as Response);

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({ isOutdated: false });
	});

	it("fails open silently on network / DNS failure", async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error("ENOTFOUND"));

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({ isOutdated: false });
	});

	it("fails open silently on timeout / abort error", async () => {
		globalThis.fetch = vi
			.fn()
			.mockRejectedValue(
				new DOMException("The operation was aborted", "TimeoutError"),
			);

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
			timeoutMs: 50,
		});

		expect(result).toEqual({ isOutdated: false });
	});

	it("fails open silently when JSON payload is missing version or malformed", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);

		const result = await client.checkFreshness({
			currentVersion: "0.5.4",
			packageName: "@arkenv/cli",
		});

		expect(result).toEqual({ isOutdated: false });
	});
});
