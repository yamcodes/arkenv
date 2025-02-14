"use client";

import { Sailboat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export function SailButton() {
	const [isSailing, setIsSailing] = useState(false);
	const router = useRouter();

	const handleSailClick = () => {
		setIsSailing(true);
	};

	return (
		<>
			<style jsx global>{`
				@keyframes double-nudge {
					0%, 100% { transform: translateX(0); }
					5%, 7% { transform: translateX(4px); }
					8% { transform: translateX(2px); }
					15%, 17% { transform: translateX(4px); }
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
				onClick={handleSailClick}
				variant="outline"
				className="relative overflow-hidden cursor-pointer dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 dark:hover:text-primary-foreground"
			>
				<Sailboat
					className={`transition-transform duration-[1500ms] ease-in-out ${isSailing ? "translate-x-[1000%]" : ""}`}
					onTransitionEnd={() => router.push("/docs/quickstart")}
				/>
				<span
					className={`transition-transform duration-[1500ms] ease-in-out ${isSailing ? "translate-x-2" : ""}`}
				>
					Set sail{" "}
					<span
						className={`inline-block ${!isSailing ? "nudge-animation" : ""}`}
					>
						--&gt;
					</span>
				</span>
			</Button>
		</>
	);
}
