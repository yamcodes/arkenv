"use client";

import { Button } from "~/components/ui/button";

export function QuickstartButton() {
	return (
		<Button
			asChild
			size="lg"
			className="w-full sm:w-auto text-md font-semibold text-white relative overflow-hidden rounded-xl transition-all duration-300 ease-in-out bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(59,130,246,0.5)] active:scale-[0.98] border-t border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group"
		>
			<a
				href="/docs/arkenv/quickstart"
				className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-8"
			>
				{/* Subtle sheen effect */}
				<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

				<span className="relative z-10 flex items-center gap-2">
					Quickstart
					<span className="text-white/70 group-hover:text-white transition-colors duration-300">
						-&gt;
					</span>
				</span>
			</a>
		</Button>
	);
}
