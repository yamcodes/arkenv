import { arkenvComponents } from "@arkenv/fumadocs-ui/components";
import * as twoslashComponents from "fumadocs-twoslash/ui";
import { Cards } from "fumadocs-ui/components/card";
import type { MDXComponents } from "mdx/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
