import { select } from "@clack/prompts";
import type { Example } from "@/shared/clients";

/**
 * Builds the example selection prompt from the registry examples.
 */
export const example = (examples: Example[]) => async () => {
	return select({
		message: "Select an example:",
		options: examples.map((t) => ({
			value: t.id,
			label: t.name,
			...(t.description ? { hint: t.description } : {}),
		})),
	});
};
