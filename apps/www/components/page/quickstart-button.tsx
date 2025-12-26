"use client";

import { Button } from "~/components/ui/button";

export function SailButton() {
	return (
		<Button
			asChild
			variant="outline"
			size="lg"
			className="w-full sm:w-auto text-md relative cursor-pointer dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 dark:hover:text-primary-foreground transition-all duration-300 shadow-[0_4px_20px_rgba(96,165,250,0.6)] dark:shadow-[0_16px_20px_rgba(96,165,250,0.6)] hover:bg-blue-500/10 bg-linear-to-r from-white/20 to-transparent"
		>
			<a
				href="/docs/arkenv/quickstart"
				className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium"
			>
				Quickstart
			</a>
		</Button>
	);
}
