import { describe, expect, it } from "vitest";
import { buildDocsFeedbackBody } from "./github";

describe("buildDocsFeedbackBody", () => {
	it("formats leading emoji, message, and page context for Discussions", () => {
		expect(
			buildDocsFeedbackBody({
				message: "Clear and helpful",
				pageTitle: "Getting started",
				url: "https://arkenv.js.org/docs/getting-started",
				emoji: "🤩",
			}),
		).toBe(
			[
				"🤩",
				"",
				"Clear and helpful",
				"",
				"> Forwarded from docs feedback on **Getting started**.",
				"> https://arkenv.js.org/docs/getting-started",
			].join("\n"),
		);
	});
});
