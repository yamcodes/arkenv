"use server";

import { PostHog } from "posthog-node";
import { getGithubRepoUrl } from "~/lib/github-links";
import { POSTHOG_API_ENDPOINT } from "~/lib/posthog/config";
import { breakDownGithubUrl } from "~/lib/utils/github";
import { docsFeedbackEmotions } from "./emotions";
import {
	type DocsFeedbackActionResponse,
	type DocsPageFeedback,
	docsPageFeedback,
} from "./schema";

function buildPrefillIssueUrl(feedback: DocsPageFeedback): string {
	const emoji =
		docsFeedbackEmotions.find((e) => e.name === feedback.opinion)?.emoji ??
		feedback.opinion;
	const url = new URL(`${getGithubRepoUrl()}/issues/new`);
	url.searchParams.set(
		"title",
		`Docs feedback [${feedback.opinion}]: ${feedback.pageTitle}`,
	);
	url.searchParams.set(
		"body",
		[
			`${emoji} **${feedback.opinion}**`,
			"",
			feedback.message,
			"",
			"---",
			`Page: ${feedback.url}`,
			"",
			"> Forwarded from docs feedback.",
		].join("\n"),
	);
	return url.toString();
}

async function capturePostHog(feedback: DocsPageFeedback): Promise<void> {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!key) return;

	const posthog = new PostHog(key, { host: POSTHOG_API_ENDPOINT });
	try {
		posthog.capture({
			distinctId: "docs-feedback-anonymous",
			event: "on_rate_docs",
			properties: {
				...feedback,
				$current_url: feedback.url,
			},
		});
		await posthog.shutdown();
	} catch {
		// Analytics must not block feedback submission.
	}
}

async function createGithubIssue(
	feedback: DocsPageFeedback,
): Promise<string | undefined> {
	const token = process.env.GITHUB_FEEDBACK_TOKEN;
	if (!token) return undefined;

	const emoji =
		docsFeedbackEmotions.find((e) => e.name === feedback.opinion)?.emoji ??
		feedback.opinion;
	const { owner, repo } = breakDownGithubUrl();
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/issues`,
		{
			method: "POST",
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${token}`,
				"X-GitHub-Api-Version": "2022-11-28",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: `Docs feedback [${feedback.opinion}]: ${feedback.pageTitle}`,
				body: [
					`${emoji} **${feedback.opinion}**`,
					"",
					feedback.message,
					"",
					"---",
					`Page: ${feedback.url}`,
					"",
					"> Forwarded from docs feedback.",
				].join("\n"),
				labels: ["docs", "www"],
			}),
		},
	);

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		console.error("[docs-feedback] GitHub issue create failed", response.status, text);
		return undefined;
	}

	const data = (await response.json()) as { html_url?: string };
	return data.html_url;
}

/**
 * Fumadocs-style submit: persist feedback (PostHog + GitHub issue when possible).
 * Without `GITHUB_FEEDBACK_TOKEN`, returns a prefilled issue URL for the client to open.
 */
export async function submitDocsFeedback(
	input: DocsPageFeedback,
): Promise<DocsFeedbackActionResponse> {
	try {
		const feedback = docsPageFeedback.parse(input);
		await capturePostHog(feedback);

		const createdUrl = await createGithubIssue(feedback);
		if (createdUrl) {
			return { success: true, githubUrl: createdUrl, created: true };
		}

		return {
			success: true,
			githubUrl: buildPrefillIssueUrl(feedback),
			created: false,
		};
	} catch (error) {
		console.error("[docs-feedback] submit failed", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to submit feedback",
		};
	}
}
