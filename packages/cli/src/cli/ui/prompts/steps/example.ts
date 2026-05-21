import { isCancel, select } from "@clack/prompts";
import type { Example } from "@/shared/clients";

/**
 * Builds the example selection prompt from the registry examples.
 */
export async function exampleStep(options: {
	examples: Example[];
}): Promise<string | null> {
	const answer = await select({
		message: "Select an example:",
		options: options.examples.map((t) => ({
			value: t.id,
			label: t.name,
			...(t.description ? { hint: t.description } : {}),
		})),
	});
	return isCancel(answer) ? null : answer;
}
