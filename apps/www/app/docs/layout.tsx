import { SiGithub } from "@icons-pack/react-simple-icons";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { InstallButton } from "~/components/docs/install-button";
import { source } from "~/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<main>
			<DocsLayout
				tree={source.pageTree}
				sidebar={{
					banner: <InstallButton />,
				}}
				{...baseOptions}
				links={[
					{
						text: "Roadmap",
						url: "https://github.com/yamcodes/arkenv/issues/683",
						active: "none",
						external: true,
					},
					{
						text: "GitHub",
						url: "https://github.com/yamcodes/arkenv",
						active: "none",
						type: "icon",
						icon: <SiGithub aria-label="GitHub" />,
					},
				]}
			>
				{children}
			</DocsLayout>
		</main>
	);
}
