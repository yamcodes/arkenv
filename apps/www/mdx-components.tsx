import * as twoslashComponents from "fumadocs-twoslash/ui";
import { arkenvComponents } from "@arkenv/fumadocs-ui-theme/mdx";
import type { MDXComponents } from "mdx/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Cards } from "fumadocs-ui/components/card";

export function getMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...arkenvComponents,
		...twoslashComponents,
		Button,
		Card,
		Cards,
		...components,
	};
}
