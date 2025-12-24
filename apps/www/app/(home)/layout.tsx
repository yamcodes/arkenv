import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { ThemeToggle } from "~/components/page";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<HomeLayout
			{...baseOptions}
			themeSwitch={{
				component: <ThemeToggle />,
			}}
			links={[
				{
					text: "Documentation",
					url: "/docs/arkenv",
					active: "none",
				},
			]}
		>
			{children}
		</HomeLayout>
	);
}
