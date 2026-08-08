"use server";

import { PostHog } from "posthog-node";
import { POSTHOG_API_ENDPOINT } from "~/lib/posthog/config";
import { docsFeedbackEmotions } from "./emotions";
import { buildDocsFeedbackBody, createDocsFeedbackDiscussion } from "./github";
import {
	type DocsFeedbackActionResponse,
	type DocsPageFeedback,
	docsPageFeedback,
} from "./schema";

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

/**
 * Fumadocs-style submit: PostHog + anonymous GitHub Discussion via GitHub App.
 * One Discussion per docs path; further feedback becomes comments on that thread.
 */
export async function submitDocsFeedback(
	input: DocsPageFeedback,
): Promise<DocsFeedbackActionResponse> {
	try {
		const feedback = docsPageFeedback.parse(input);
		await capturePostHog(feedback);

		const pageId = new URL(feedback.url).pathname;
		const emoji =
			docsFeedbackEmotions.find((e) => e.name === feedback.opinion)?.emoji ??
			undefined;
		const body = buildDocsFeedbackBody({
			opinion: feedback.opinion,
			message: feedback.message,
			pageTitle: feedback.pageTitle,
			url: feedback.url,
			emoji,
		});

		const githubUrl = await createDocsFeedbackDiscussion(pageId, body);
		return { success: true, githubUrl };
	} catch (error) {
		console.error("[docs-feedback] submit failed", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to submit feedback",
		};
	}
}
