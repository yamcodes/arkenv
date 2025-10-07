import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "~/components/page/logo";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: <Logo className="text-xl mb-1" />,
	},
	githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL,
};
