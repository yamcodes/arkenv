import { Header } from "@arkenv/fumadocs-ui/components";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { CSSProperties, ReactNode } from "react";
import { InstallButton } from "~/components/docs/install-button";
import { Logo } from "~/components/page/logo";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { source } from "~/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<main
			style={
				{
					"--fd-banner-height": "var(--fd-nav-height, 80px)",
					"--fd-layout-width": "1400px",
				} as CSSProperties
			}
		>
			<DocsLayout
				tree={source.pageTree}
				sidebar={{
					banner: <InstallButton />,
				}}
				nav={{
					component: (
						<Header
							logo={<Logo />}
							links={[
								{ text: "Documentation", url: "/docs/arkenv" },
								{
									text: "Roadmap",
									url: "https://github.com/yamcodes/arkenv/issues/683",
								},
							]}
							actions={[
								<ThemeToggle key="theme-toggle" />,
								<a
									key="github"
									href="https://github.com/yamcodes/arkenv"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="GitHub"
									className="flex items-center justify-center h-8 w-8 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
								>
									<SiGithub className="size-4" />
								</a>,
							]}
						/>
					),
				}}
			>
				{children}
			</DocsLayout>
		</main>
	);
}
