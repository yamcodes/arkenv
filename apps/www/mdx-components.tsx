import * as twoslashComponents from "fumadocs-twoslash/ui";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Cards } from "fumadocs-ui/components/card";
import { CodeBlock, CodeBlockTab, Pre } from "fumadocs-ui/components/codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";

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
	h1: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h1" />
	),
	h2: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h2" />
	),
	h3: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h3" />
	),
	h4: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h4" />
	),
	h5: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h5" />
	),
	h6: (props: React.ComponentProps<typeof Heading>) => (
		<Heading {...props} as="h6" />
	),
	// biome-ignore lint/suspicious/noExplicitAny: See https://fumadocs.dev/docs/ui/components/image-zoom#usage
	img: (props: any) => <ImageZoom {...(props as any)} quality={100} />,
	pre: ({ ref: _ref, ...props }: any) => (
		<CodeBlock {...props}>
			<Pre>{props.children}</Pre>
		</CodeBlock>
	),
};

export function getMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...defaultComponents,
		...customComponents,
		...twoslashComponents,
		...components,
	};
}
