import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { InstallButton } from "~/components/docs/install-button";
import { source } from "~/lib/source-ui";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<main>
			<DocsLayout
				tree={source.pageTree}
				sidebar={{
					banner: <InstallButton />,
				}}
				{...baseOptions}
			>
				{children}
			</DocsLayout>
		</main>
	);
}
