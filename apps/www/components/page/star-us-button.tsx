"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils/cn";
import { breakDownGithubUrl } from "~/lib/utils/github";

const starUsButtonVariants = cva("text-lg font-bold", {
	variants: {
		variant: {
			mobile: [
				"w-full",
				"bg-gradient-to-r from-yellow-50 to-orange-50",
				"hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100",
				"dark:from-yellow-900/20 dark:to-orange-900/20",
				"dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30",
				"border-2 border-yellow-200 dark:border-yellow-700",
				"text-yellow-800 dark:text-yellow-200",
				"hover:text-yellow-800 dark:hover:text-yellow-200",
				"transition-colors duration-200",
			],
			desktop: [
				"relative overflow-hidden cursor-pointer",
				"bg-gradient-to-r from-yellow-50 to-orange-50",
				"dark:from-yellow-900/20 dark:to-orange-900/20",
				"border-2 border-yellow-200 dark:border-yellow-700",
				"text-yellow-800 dark:text-yellow-200",
				"hover:text-yellow-800 dark:hover:text-yellow-200",
				"transition-all duration-200 ease-in-out scale-100",
				"focus-visible:ring-2 focus-visible:ring-[rgba(255,150,0,0.7)] focus-visible:ring-offset-0",
				"hover:scale-105",
			],
		},
	},
	defaultVariants: {
		variant: "mobile",
	},
});

const starUsShadowVariants = cva(
	"absolute inset-0 rounded-lg pointer-events-none",
	{
		variants: {
			variant: {
				mobile: [
					"shadow-[0_8px_16px_rgba(255,150,0,0.1)]",
					"dark:shadow-[0_8px_16px_rgba(255,150,0,0.15)]",
				],
				desktop: [
					"shadow-[0_16px_20px_rgba(255,150,0,0.1)]",
					"dark:shadow-[0_16px_20px_rgba(255,150,0,0.15)]",
				],
			},
		},
		defaultVariants: {
			variant: "desktop",
		},
	},
);

type StarUsProps = {
	className?: string;
} & VariantProps<typeof starUsButtonVariants>;

export function StarUsButton({ className }: StarUsProps) {
	const [starCount, setStarCount] = useState<number | null>(null);

	// Compute githubUrl once and extract owner/repo
	const githubUrl =
		process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/yamcodes/arkenv";
	const { owner, repo } = breakDownGithubUrl(githubUrl);

	// Fetch star count from GitHub API
	useEffect(() => {
		const fetchStarCount = async () => {
			try {
				const response = await fetch(
					`https://api.github.com/repos/${owner}/${repo}`,
				);
				if (response.ok) {
					const data = await response.json();
					setStarCount(data.stargazers_count);
				}
			} catch {
				// Silently fail - we'll just not show the count
			}
		};

		fetchStarCount();
	}, [owner, repo]);

	return (
		<>
			{/* Desktop styles - only apply on sm and up */}
			<style jsx global>{`
				@media (min-width: 640px) {
					@keyframes sparkle {
						0%, 100% { 
							opacity: 0;
							transform: scale(0) rotate(0deg);
						}
						50% { 
							opacity: 1;
							transform: scale(1) rotate(180deg);
						}
					}
					
					@keyframes star-bounce {
						0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
						25% { transform: translateY(-3px) scale(1.05) rotate(5deg); }
						50% { transform: translateY(-6px) scale(1.1) rotate(0deg); }
						75% { transform: translateY(-3px) scale(1.05) rotate(-5deg); }
					}
					.star-sparkle {
						animation: sparkle 2s ease-in-out infinite;
					}
					
					.star-bounce {
						animation: star-bounce 2.5s ease-in-out infinite;
					}
				}
			`}</style>

			{/* Mobile: Simple button with glow */}
			<div className="sm:hidden w-full relative">
				{/* Shadow element for mobile */}
				<div className={starUsShadowVariants({ variant: "mobile" })} />

				<Button
					asChild
					variant="outline"
					size="lg"
					className={cn(starUsButtonVariants({ variant: "mobile" }), className)}
				>
					<a
						href={`https://github.com/${owner}/${repo}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<div className="flex items-center gap-2">
							<SiGithub className="w-4 h-4" />
							<span className="font-semibold">Star us on GitHub!</span>
							<Star
								className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
								fill="currentColor"
							/>
							{starCount !== null && (
								<span className="font-semibold text-yellow-700 dark:text-yellow-300">
									{starCount.toLocaleString()}
								</span>
							)}
						</div>
					</a>
				</Button>
			</div>

			{/* Desktop: Complex button with animations and effects */}
			<div className="hidden sm:block relative">
				{/* Shadow element that doesn't scale */}
				<div className={starUsShadowVariants({ variant: "desktop" })} />

				<Button
					asChild
					variant="outline"
					size="lg"
					className={cn(
						starUsButtonVariants({ variant: "desktop" }),
						className,
					)}
				>
					<a
						href={`https://github.com/${owner}/${repo}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* Sparkle effects */}
						<div className="absolute inset-0 pointer-events-none">
							<div
								className="absolute top-1 left-2 w-1 h-1 bg-yellow-400 rounded-full star-sparkle"
								style={{ animationDelay: "0s" }}
							/>
							<div
								className="absolute top-2 right-3 w-1 h-1 bg-yellow-400 rounded-full star-sparkle"
								style={{ animationDelay: "0.5s" }}
							/>
							<div
								className="absolute bottom-2 left-4 w-1 h-1 bg-yellow-400 rounded-full star-sparkle"
								style={{ animationDelay: "1s" }}
							/>
							<div
								className="absolute bottom-1 right-2 w-1 h-1 bg-yellow-400 rounded-full star-sparkle"
								style={{ animationDelay: "1.5s" }}
							/>
						</div>

						{/* Main content */}
						<div className="flex items-center gap-2 relative z-10">
							<SiGithub className="w-4 h-4" />
							<span className="font-semibold">Star us on GitHub!</span>
							<Star
								className="w-5 h-5 transition-all duration-300 star-bounce text-yellow-600 dark:text-yellow-400"
								fill="currentColor"
							/>
							{starCount !== null && (
								<span className="font-semibold text-yellow-700 dark:text-yellow-300">
									{starCount.toLocaleString()}
								</span>
							)}
						</div>
					</a>
				</Button>
			</div>
		</>
	);
}
