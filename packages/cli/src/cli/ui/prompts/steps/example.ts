import { select } from "@clack/prompts";
import type { Template } from "@/shared/clients/registry.client";

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
