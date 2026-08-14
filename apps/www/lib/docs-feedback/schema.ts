import { z } from "zod";
import { docsFeedbackEmotions } from "./emotions";

const emotionNames = docsFeedbackEmotions.map((e) => e.name) as [
	(typeof docsFeedbackEmotions)[number]["name"],
	...(typeof docsFeedbackEmotions)[number]["name"][],
];

/**
 * Page feedback payload (Turborepo-style emotions + Fumadocs Discussion sink).
 */
export const docsPageFeedback = z.object({
	url: z.string().min(1),
	pageTitle: z.string().min(1),
	opinion: z.enum(emotionNames),
	message: z.string().trim().min(1).max(4000),
});

export type DocsPageFeedback = z.infer<typeof docsPageFeedback>;

export const docsFeedbackActionResponse = z.object({
	success: z.boolean(),
	/**
	 * Created Discussion / comment URL when the GitHub App post succeeds.
	 */
	githubUrl: z.string().optional(),
	error: z.string().optional(),
});

export type DocsFeedbackActionResponse = z.infer<
	typeof docsFeedbackActionResponse
>;
