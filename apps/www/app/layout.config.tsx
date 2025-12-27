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
};
