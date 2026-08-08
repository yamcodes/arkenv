import { describe, expect, it } from "vitest";
import { buildDocsFeedbackBody } from "./github";

describe("buildDocsFeedbackBody", () => {
	it("formats opinion, message, and page context for Discussions", () => {
		expect(
			buildDocsFeedbackBody({
				opinion: "amazed",
				message: "Clear and helpful",
				pageTitle: "Getting started",
				url: "https://arkenv.js.org/docs/getting-started",
				emoji: "🤩",
			}),
		).toBe(
			[
				"🤩 **amazed** Clear and helpful",
				"",
				"> Forwarded from docs feedback on **Getting started**.",
				">",
				"> https://arkenv.js.org/docs/getting-started",
			].join("\n"),
		);
	});

	it("falls back to bracketed opinion without emoji", () => {
		expect(
			buildDocsFeedbackBody({
				opinion: "sad",
				message: "Missing example",
				pageTitle: "CLI",
				url: "https://arkenv.js.org/docs/cli",
			}),
		).toContain("[sad] Missing example");
	});
});
