import { DocsLayout, type LinkItemType } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { source } from "~/lib/source";
import { SiGithub } from "@icons-pack/react-simple-icons";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.pageTree}
			{...baseOptions}
			links={[
				{
					text: "Documentation",
					url: "/docs",
					active: "nested-url",
				},
				...(process.env.NEXT_PUBLIC_GITHUB_URL
					? [
							{
								text: "GitHub",
								url: process.env.NEXT_PUBLIC_GITHUB_URL,
								active: "url",
								icon: <SiGithub />,
							} as const satisfies LinkItemType,
						]
					: []),
			]}
		>
			{children}
		</DocsLayout>
	);
}
