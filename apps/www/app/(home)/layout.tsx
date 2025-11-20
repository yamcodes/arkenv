import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<HomeLayout
			{...baseOptions}
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
