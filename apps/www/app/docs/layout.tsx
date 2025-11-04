import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { source } from "~/lib/source";
import { ScrollableFocus } from "~/components/page/scrollable-focus";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout tree={source.pageTree} {...baseOptions}>
			<ScrollableFocus />
			{children}
		</DocsLayout>
	);
}
