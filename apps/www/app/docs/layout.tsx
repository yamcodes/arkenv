import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { ThemeToggle } from "~/components/page";
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
			themeSwitch={{
				component: <ThemeToggle />,
			}}
		>
			{children}
		</DocsLayout>
	);
}
