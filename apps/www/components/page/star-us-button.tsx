"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils/cn";
import { breakDownGithubUrl } from "~/lib/utils/github";

const starUsButtonVariants = cva("text-md font-bold", {
	variants: {
		variant: {
			mobile: [
				"w-full",
				"bg-gradient-to-r from-yellow-50 to-orange-50",
				"dark:from-yellow-900/20 dark:to-orange-900/20",
				"hover:from-yellow-100 hover:to-orange-100",
				"dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30",
				"border-2 border-yellow-400 dark:border-yellow-700",
				"hover:border-yellow-500 dark:hover:border-yellow-600",
				"text-yellow-800 dark:text-yellow-200",
				"hover:text-yellow-800 dark:hover:text-yellow-200",
				"rounded-xl",
				"transition-colors duration-200",
			],
		},
	},
	defaultVariants: {
		variant: "mobile",
	},
});

type StarUsProps = {
	className?: string;
} & VariantProps<typeof starUsButtonVariants>;

export function StarUsButton({ className }: StarUsProps) {
	const [starCount, setStarCount] = useState<number | null>(null);

	// Compute githubUrl once and extract owner/repo
	const githubUrl =
		process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/yamcodes/arkenv";
	const { owner, repo } = breakDownGithubUrl(githubUrl);

	// Fetch star count from our API route (server-side with caching)
	useEffect(() => {
		const fetchStarCount = async () => {
			try {
				const response = await fetch("/api/github/stars");
				if (response.ok) {
					const data = (await response.json()) as { stars: number };
					setStarCount(data.stars);
				}
			} catch {
				// Silently fail - we'll just not show the count
			}
		};

		fetchStarCount();
	}, []);

	return (
		<div className="sm:hidden w-full relative">
			{/* Shadow element for mobile */}

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
						<SiGithub aria-hidden="true" className="w-4 h-4" />
						<span className="font-medium">Star us on GitHub</span>
						<Star
							aria-hidden="true"
							className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
							fill="currentColor"
						/>
						{starCount !== null && (
							<span className="font-medium text-yellow-700 dark:text-yellow-300">
								{starCount.toLocaleString()}
							</span>
						)}
					</div>
				</a>
			</Button>
		</div>
	);
}
