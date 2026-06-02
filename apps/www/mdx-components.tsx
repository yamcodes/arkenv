import { arkenvComponents } from "@arkenv/fumadocs-ui/mdx";
import * as twoslashComponents from "fumadocs-twoslash/ui";
import {
	CalloutContainer,
	CalloutDescription,
	CalloutTitle,
} from "fumadocs-ui/components/callout";
import { Cards } from "fumadocs-ui/components/card";
import type { MDXComponents } from "mdx/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/cn";

export function getMDXComponents(components: MDXComponents): MDXComponents {
	// biome-ignore lint/suspicious/noExplicitAny: arkenvComponents type is complex but we know it might have table
	const Table = (arkenvComponents as any).table ?? "table";
	return {
		...arkenvComponents,
		...twoslashComponents,
		Button,
		CalloutContainer,
		CalloutDescription,
		CalloutTitle,
		Card,
		Cards,
		...components,
		table: (props) => (
			<Table
				{...props}
				className={cn(
					"[&_td_code]:whitespace-nowrap [&_td:first-child]:w-max",
					props.className,
				)}
			/>
		),
	};
}
