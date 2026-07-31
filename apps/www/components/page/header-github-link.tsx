"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { breakDownGithubUrl } from "~/lib/utils/github";

/**
 * Single GitHub badge: icon + star count in one hit target.
 */
export function HeaderGithubLink({
	className,
	iconClassName,
}: {
	className?: string;
	iconClassName?: string;
}) {
	const [starCount, setStarCount] = useState<number | null>(null);

	const githubUrl =
		process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/yamcodes/arkenv";
	const { owner, repo } = breakDownGithubUrl(githubUrl);

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

	const label =
		starCount !== null
			? `GitHub · ${starCount.toLocaleString()} stars`
			: "GitHub";

	return (
		<a
			href={`https://github.com/${owner}/${repo}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={label}
			className={cn(
				"inline-flex items-center justify-center gap-1.5 transition-colors",
				className,
			)}
		>
			<SiGithub
				aria-hidden="true"
				className={cn("size-5 shrink-0", iconClassName)}
			/>
			{starCount !== null ? (
				<span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums">
					<Star aria-hidden="true" className="size-3 shrink-0" />
					{starCount.toLocaleString()}
				</span>
			) : null}
		</a>
	);
}
