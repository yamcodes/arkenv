export const docsFeedbackEmotions = [
	{ emoji: "😭", name: "cry" },
	{ emoji: "😕", name: "sad" },
	{ emoji: "🙂", name: "happy" },
	{ emoji: "🤩", name: "amazed" },
] as const;

export type DocsFeedbackEmotion = (typeof docsFeedbackEmotions)[number]["name"];
