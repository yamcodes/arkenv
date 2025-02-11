import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { baseOptions } from "~/app/layout.config";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<HomeLayout {...baseOptions} githubUrl={process.env.NEXT_PUBLIC_GITHUB_URL}>
			{children}
		</HomeLayout>
	);
}
