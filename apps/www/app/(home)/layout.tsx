import { HomeLayout } from "fumadocs-ui/layouts/home";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";
import { ExternalLink } from "~/components/ui/external-link";

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
					text: (
						<span data-no-underline data-external-link>
							Roadmap
						</span>
					),
					url: "https://github.com/yamcodes/arkenv/issues/683",
					external: true,
				},
				...(baseOptions.links ?? []),
			]}
		>
			{children}
		</HomeLayout>
	);
}
