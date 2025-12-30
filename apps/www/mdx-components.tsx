import * as twoslashComponents from "fumadocs-twoslash/ui";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Cards } from "fumadocs-ui/components/card";
import { CodeBlock, CodeBlockTab, Pre } from "fumadocs-ui/components/codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ExternalLink } from "~/components/ui/external-link";
import { Heading } from "~/components/ui/heading";

const createHeadingComponent =
	(level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
	(props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as={level} />
	);

const customComponents = {
	Tab,
	Tabs,
	Button,
	Card,
	Cards,
	CodeBlockTab,
	Step,
	Steps,
	Accordion,
	Accordions,
	a: ExternalLink,
	h1: createHeadingComponent("h1"),
	h2: createHeadingComponent("h2"),
	h3: createHeadingComponent("h3"),
	h4: createHeadingComponent("h4"),
	h5: createHeadingComponent("h5"),
	h6: createHeadingComponent("h6"),
	// biome-ignore lint/suspicious/noExplicitAny: See https://fumadocs.dev/docs/ui/components/image-zoom#usage
	img: (props: any) => <ImageZoom {...(props as any)} quality={100} />,
	pre: (props: ComponentPropsWithoutRef<"pre">) => (
		<CodeBlock {...props}>
			<Pre>{props.children}</Pre>
		</CodeBlock>
	),
};

export function getMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...defaultComponents,
		...twoslashComponents,
		...customComponents,
		...components,
	};
}
