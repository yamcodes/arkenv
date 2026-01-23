import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CodeBlock, Pre } from "@/components/code-blocks";
import { ExternalLink } from "@/components/external-link";
import { Heading } from "@/components/heading";

export const arkenvComponents: MDXComponents = {
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
	pre: ({ ref: _ref, ...props }: any) => (
		<CodeBlock {...props}>
			<Pre>{props.children}</Pre>
		</CodeBlock>
	),
	h1: (props: any) => <Heading as="h1" {...props} />,
	h2: (props: any) => <Heading as="h2" {...props} />,
	h3: (props: any) => <Heading as="h3" {...props} />,
	h4: (props: any) => <Heading as="h4" {...props} />,
	h5: (props: any) => <Heading as="h5" {...props} />,
	h6: (props: any) => <Heading as="h6" {...props} />,
};
