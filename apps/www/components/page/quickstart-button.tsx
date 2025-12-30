"use client";

import { Button } from "~/components/ui/button";

export function QuickstartButton() {
	return (
		<Button
			asChild
			size="lg"
			className="w-full sm:w-auto text-md font-semibold text-white relative overflow-hidden rounded-xl transition-all duration-200 ease-in-out bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 hover:scale-[1.05] hover:shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-[0.98] border-t border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
		>
			<a
				href="/docs/arkenv/quickstart"
				className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-8"
			>
				<span className="relative z-10 flex items-center gap-2">
					Quickstart
				</span>
			</a>
		</Button>
	);
}
