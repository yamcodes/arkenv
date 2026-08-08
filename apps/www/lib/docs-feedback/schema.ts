import { z } from "zod";
import { docsFeedbackEmotions } from "./emotions";

const emotionNames = docsFeedbackEmotions.map((e) => e.name) as [
	(typeof docsFeedbackEmotions)[number]["name"],
	...(typeof docsFeedbackEmotions)[number]["name"][],
];

/** Fumadocs-style page feedback payload (Geist Docs / Turbo emotions). */
export const docsPageFeedback = z.object({
	url: z.string().min(1),
	pageTitle: z.string().min(1),
	opinion: z.enum(emotionNames),
	message: z.string().trim().min(1).max(4000),
});

export type DocsPageFeedback = z.infer<typeof docsPageFeedback>;

export const docsFeedbackActionResponse = z.object({
	success: z.boolean(),
	/** Created issue URL, or prefilled `/issues/new` URL when no token. */
	githubUrl: z.string().optional(),
	/** True when an issue was created via API (not just a prefill link). */
	created: z.boolean().optional(),
	error: z.string().optional(),
});

export type DocsFeedbackActionResponse = z.infer<
	typeof docsFeedbackActionResponse
>;
