import { SiGithub } from "@icons-pack/react-simple-icons";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { InstallButton } from "~/components/docs/install-button";
import { source } from "~/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.pageTree}
			sidebar={{
				banner: <InstallButton />,
			}}
			{...baseOptions}
			links={[
				{
					text: "GitHub",
					url: "https://github.com/yamcodes/arkenv",
					active: "none",
					type: "icon",
					icon: <SiGithub aria-label="GitHub" />,
				},
			]}
		>
			<main className="[grid-area:main] flex flex-col">{children}</main>
		</DocsLayout>
	);
}
