import { SiGithub } from "@icons-pack/react-simple-icons";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "~/components/page/logo";
import { ThemeToggle } from "~/components/ui/theme-toggle";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: <Logo />,
	},
	themeSwitch: {
		component: <ThemeToggle key="theme-toggle" />,
	},
	links: [
		{
			text: "GitHub",
			url: "https://github.com/yamcodes/arkenv",
			active: "none",
			type: "icon",
			icon: <SiGithub aria-label="GitHub" />,
		},
		{
			text: "Roadmap",
			url: "https://github.com/yamcodes/arkenv/issues/683",
			active: "none",
			external: true,
		},
	],
};
