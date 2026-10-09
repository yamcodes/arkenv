import type { ReactNode } from "react";
import { DocsChrome } from "~/components/docs/docs-chrome";
import { source } from "~/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return <DocsChrome tree={source.pageTree}>{children}</DocsChrome>;
}
