export const docsFeedbackEmotions = [
	{ emoji: "👎", name: "dislike", label: "Dislike" },
	{ emoji: "👍", name: "like", label: "Like" },
	{ emoji: "❤️", name: "love", label: "Love" },
] as const;

export type DocsFeedbackEmotion = (typeof docsFeedbackEmotions)[number]["name"];
