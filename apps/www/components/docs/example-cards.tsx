import { Card, Cards } from "fumadocs-ui/components/card";
import { getGithubRepoUrl } from "~/lib/github-links";
import registry from "../../../../examples/registry.json";

type Example = {
	id: string;
	name: string;
	description?: string;
	framework: string;
};

const examples = (registry as { examples: Example[] }).examples;

function exampleTreeUrl(id: string): string {
	const ref =
		process.env.VERCEL_GIT_COMMIT_REF ??
		process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ??
		"main";
	return `${getGithubRepoUrl()}/tree/${encodeURIComponent(ref)}/examples/${id}`;
}

/**
 * Renders the Getting Started example cards from `examples/registry.json`
 * so the docs site and `arkenv init --example` share one source of truth.
 */
export function ExampleCards() {
	return (
		<Cards>
			{examples.map((example) => (
				<Card
					key={example.id}
					href={exampleTreeUrl(example.id)}
					title={example.id}
					description={example.description ?? example.name}
				/>
			))}
		</Cards>
	);
}
