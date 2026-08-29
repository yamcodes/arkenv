import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import {
	CodeBlock,
	CodeBlockTab,
	CodeBlockTabs,
	CodeBlockTabsList,
	CodeBlockTabsTrigger,
	Pre,
} from "@/components/code-blocks";
import { ExternalLink } from "@/components/external-link";
import { Heading } from "@/components/heading";
import { cn } from "@/utils/cn";

/**
 * Wrap markdown tables so wide overflow regions stay keyboard-focusable
 * (axe `scrollable-region-focusable`).
 *
 * @param props Native table props forwarded to the inner `<table>`
 */
function Table(props: ComponentProps<"table">) {
	return (
		<div
			className={cn(
				"relative overflow-auto prose-no-margin my-6 fd-scroll-container",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fd-ring",
			)}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: overflow region must be focusable for axe scrollable-region-focusable
			tabIndex={0}
		>
			<table {...props} />
		</div>
	);
}

export const arkenvComponents = {
	...defaultComponents,
	a: ExternalLink as any,
	img: (props) => (
		<ImageZoom {...(props as React.ComponentProps<typeof ImageZoom>)} />
	),
	Step,
	Steps,
	File,
	Folder,
	Files,
	Accordion,
	Accordions,
	Tab,
	Tabs,
	table: Table,
	pre: ({ ref: _ref, ...props }: any) => (
		<CodeBlock {...props}>
			<Pre>{props.children}</Pre>
		</CodeBlock>
	),
	CodeBlockTabs,
	CodeBlockTabsList,
	CodeBlockTabsTrigger,
	CodeBlockTab,
	h1: (props: any) => <Heading as="h1" {...props} />,
	h2: (props: any) => <Heading as="h2" {...props} />,
	h3: (props: any) => <Heading as="h3" {...props} />,
	h4: (props: any) => <Heading as="h4" {...props} />,
	h5: (props: any) => <Heading as="h5" {...props} />,
	h6: (props: any) => <Heading as="h6" {...props} />,
} satisfies MDXComponents;
