import { select } from "@clack/prompts";
import type { Template } from "@/shared/clients";

/**
 * Builds the example template selection prompt from the registry templates.
 */
export const example = (templates: Template[]) => async () => {
	return select({
		message: "Select a template:",
		options: templates.map((t) => ({
			value: t.id,
			label: t.name,
			...(t.description ? { hint: t.description } : {}),
		})),
	});
};
