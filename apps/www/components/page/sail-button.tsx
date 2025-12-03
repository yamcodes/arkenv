"use client";

import { Sailboat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export function SailButton() {
	const [isSailing, setIsSailing] = useState(false);
	const router = useRouter();

	const handleSailClick = (e: React.MouseEvent) => {
		// Allow middle-click and Ctrl+click to work normally (open in new tab)
		if (e.button === 1 || e.ctrlKey || e.metaKey) {
			return; // Let the browser handle it
		}

		// Only handle left-click for the animation
		e.preventDefault();
		setIsSailing(true);
	};

	return (
		<>
			<style jsx global>{`
				@keyframes double-nudge {
					0%, 100% { transform: translateX(0); }
					5%, 7% { transform: translateX(2px); }
					8% { transform: translateX(1px); }
					15%, 17% { transform: translateX(2px); }
					18% { transform: translateX(2.5px); }
					21% { transform: translateX(1.5px); }
					25% { transform: translateX(0.5px); }
					28% { transform: translateX(0); }
				}
				.nudge-animation {
					animation: double-nudge 4s cubic-bezier(.4,0,.2,1) infinite;
					animation-delay: 1.5s;
				}
			`}</style>
			<Button
				asChild
				variant="outline"
				size="lg"
				className="w-full sm:w-auto text-lg relative overflow-hidden cursor-pointer dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 dark:hover:text-primary-foreground transition-all duration-300 shadow-[0_4px_20px_rgba(96,165,250,0.6)] dark:shadow-[0_16px_20px_rgba(96,165,250,0.6)] hover:bg-blue-500/10 bg-gradient-to-r from-white/20 to-transparent"
			>
				<a
					href="/docs/arkenv/quickstart"
					onClick={handleSailClick}
					className="inline-flex items-center justify-center gap-2 whitespace-nowrap pr-1"
				>
					<Sailboat
						aria-hidden="true"
						className={`transition-transform duration-[700ms] ease-in ${isSailing ? "translate-x-[1000%]" : ""}`}
						onTransitionEnd={() => router.push("/docs/arkenv/quickstart")}
					/>
					<span className="font-semibold">
						Set sail{" "}
						<span
							className={`inline-block ${!isSailing ? "nudge-animation" : ""} ml-1`}
						>
							-&gt;
						</span>
					</span>
				</a>
			</Button>
		</>
	);
}
