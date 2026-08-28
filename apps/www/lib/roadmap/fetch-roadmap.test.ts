import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/roadmap/config", () => ({
	ROADMAP_MILESTONE_NUMBER: 1,
	ROADMAP_EXCLUDE_ISSUE_NUMBERS: new Set([683, 1306, 1590]),
	ROADMAP_EXTRAS: [
		{ id: "zebra-first", title: "Zebra launch step", done: false },
		{ id: "alpha-second", title: "Alpha launch step", done: false },
		{ id: "done-extra", title: "Already done extra", done: true },
	],
}));

describe("fetchRoadmap", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("merges milestone issues with extras and computes progress", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes("/milestones/1") && !url.includes("issues")) {
					return Response.json({
						number: 1,
						title: "v1",
						html_url: "https://github.com/yamcodes/arkenv/milestone/1",
						open_issues: 2,
						closed_issues: 1,
					});
				}
				if (url.includes("/issues")) {
					return Response.json([
						{
							number: 683,
							title: "v1 Roadmap",
							state: "open",
							html_url: "https://github.com/yamcodes/arkenv/issues/683",
						},
						{
							number: 1306,
							title: "README launch links",
							state: "open",
							html_url: "https://github.com/yamcodes/arkenv/issues/1306",
						},
						{
							number: 10,
							title: "Open work",
							state: "open",
							html_url: "https://github.com/yamcodes/arkenv/issues/10",
						},
						{
							number: 9,
							title: "Shipped work",
							state: "closed",
							html_url: "https://github.com/yamcodes/arkenv/issues/9",
						},
						{
							number: 11,
							title: "A PR on the milestone",
							state: "closed",
							html_url: "https://github.com/yamcodes/arkenv/pull/11",
							pull_request: {},
						},
					]);
				}
				throw new Error(`unexpected fetch: ${url}`);
			}),
		);

		const { fetchRoadmap } = await import("./fetch-roadmap");
		const roadmap = await fetchRoadmap();

		expect(roadmap.stale).toBe(false);
		expect(roadmap.totalCount).toBe(5); // 2 issues + 3 extras (meta issues + PR skipped)
		expect(roadmap.doneCount).toBe(2);
		expect(roadmap.percent).toBe(40);
		// Open issues first, then extras in config order (not alphabetical).
		expect(roadmap.items.map((item) => item.id)).toEqual([
			"issue:10",
			"extra:zebra-first",
			"extra:alpha-second",
			"issue:9",
			"extra:done-extra",
		]);
	});

	it("keeps milestone issues when only meta fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes("/milestones/1") && !url.includes("issues")) {
					return new Response("forbidden", { status: 403 });
				}
				if (url.includes("/issues")) {
					return Response.json([
						{
							number: 10,
							title: "Open work",
							state: "open",
							html_url: "https://github.com/yamcodes/arkenv/issues/10",
						},
					]);
				}
				throw new Error(`unexpected fetch: ${url}`);
			}),
		);

		const { fetchRoadmap } = await import("./fetch-roadmap");
		const roadmap = await fetchRoadmap();

		expect(roadmap.stale).toBe(false);
		expect(roadmap.milestone.title).toBe("v1");
		expect(roadmap.items.map((item) => item.id)).toContain("issue:10");
		expect(roadmap.items.map((item) => item.id)).toContain("extra:zebra-first");
	});

	it("falls back to extras when the issues list fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes("/milestones/1") && !url.includes("issues")) {
					return Response.json({
						number: 1,
						title: "v1",
						html_url: "https://github.com/yamcodes/arkenv/milestone/1",
						open_issues: 0,
						closed_issues: 0,
					});
				}
				if (url.includes("/issues")) {
					return new Response("rate limited", { status: 403 });
				}
				throw new Error(`unexpected fetch: ${url}`);
			}),
		);

		const { fetchRoadmap } = await import("./fetch-roadmap");
		const roadmap = await fetchRoadmap();

		expect(roadmap.stale).toBe(true);
		expect(roadmap.milestone.url).toBe(
			"https://github.com/yamcodes/arkenv/milestone/1",
		);
		expect(roadmap.items.map((item) => item.id)).toEqual([
			"extra:zebra-first",
			"extra:alpha-second",
			"extra:done-extra",
		]);
	});

	it("falls back to extras when GitHub is fully down", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network down");
			}),
		);

		const { fetchRoadmap } = await import("./fetch-roadmap");
		const roadmap = await fetchRoadmap();

		expect(roadmap.stale).toBe(true);
		expect(roadmap.items.map((item) => item.id)).toEqual([
			"extra:zebra-first",
			"extra:alpha-second",
			"extra:done-extra",
		]);
	});
});
