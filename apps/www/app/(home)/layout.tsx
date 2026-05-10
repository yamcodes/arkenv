import { Header } from "@arkenv/fumadocs-ui/components";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { CSSProperties, ReactNode } from "react";
import { HeaderGithubLink } from "~/components/page/header-github-link";
import { Logo } from "~/components/page/logo";
import { SearchToggle } from "~/components/ui/search-toggle";
import { ThemeToggle } from "~/components/ui/theme-toggle";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<HomeLayout
			style={{ paddingTop: "var(--fd-nav-height, 80px)" } as CSSProperties}
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
							<SearchToggle key="search" />,
							<div key="theme-desktop" className="hidden md:block">
								<ThemeToggle />
							</div>,
							<HeaderGithubLink
								key="github"
								className="hidden md:flex h-8 text-fd-muted-foreground hover:text-fd-foreground"
							/>,
						]}
						menuActions={[<ThemeToggle key="theme-toggle" />]}
						menuSocialActions={[
							<HeaderGithubLink
								key="github"
								className="h-8 text-fd-muted-foreground hover:text-fd-foreground"
								iconClassName="size-6"
							/>,
						]}
					/>
				),
			}}
		>
			{children}
		</HomeLayout>
	);
}
