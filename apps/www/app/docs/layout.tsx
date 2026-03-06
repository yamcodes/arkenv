import { Header } from "@arkenv/fumadocs-ui/components";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { CSSProperties, ReactNode } from "react";
import { InstallButton } from "~/components/docs/install-button";
import { DocsSidebarTrigger } from "~/components/docs/sidebar-trigger";
import { Logo } from "~/components/page/logo";
import { SearchToggle } from "~/components/ui/search-toggle";
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
					collapsible: false,
				}}
				themeSwitch={{ enabled: false }}
				searchToggle={{ enabled: false }}
				nav={{
					title: <span className="sr-only">ArkEnv</span>,
					component: (
						<>
							{/* Spacer in the docs grid "header" area so content starts below our fixed header */}
							<div
								className="[grid-area:header]"
								style={{ height: "var(--fd-nav-height, 80px)" }}
								aria-hidden="true"
							/>
							<Header
								logo={<Logo />}
								sidebarTrigger={<DocsSidebarTrigger />}
								links={[
									{ text: "Documentation", url: "/docs/arkenv" },
									{
										text: "Roadmap",
										url: "https://github.com/yamcodes/arkenv/issues/683",
									},
								]}
								actions={[
									<SearchToggle key="search" />,
									<div key="theme-desktop" className="hidden md:block">
										<ThemeToggle />
									</div>,
									<a
										key="github"
										href="https://github.com/yamcodes/arkenv"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="GitHub"
										className="hidden md:flex items-center justify-center h-8 w-8 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
									>
										<SiGithub className="size-5" />
									</a>,
								]}
								menuActions={[<ThemeToggle key="theme-toggle" />]}
								menuSocialActions={[
									<a
										key="github"
										href="https://github.com/yamcodes/arkenv"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="GitHub"
										className="flex items-center justify-center h-8 w-8 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
									>
										<SiGithub className="size-6" />
									</a>,
								]}
							/>
						</>
					),
				}}
			>
				{children}
			</DocsLayout>
		</main>
	);
}
