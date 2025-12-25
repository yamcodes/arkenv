import { SiGithub } from "@icons-pack/react-simple-icons";
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
		</HomeLayout>
	);
}
