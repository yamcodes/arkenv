"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { breakDownGithubUrl } from "~/lib/utils/github";

export function HeaderGithubLink({ className, iconClassName }: { className?: string; iconClassName?: string }) {
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

	return (
		<a
			href={`https://github.com/${owner}/${repo}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="GitHub"
			className={`group flex items-center justify-center gap-2 transition-colors ${className || ""}`}
		>
			<SiGithub className={iconClassName || "size-5"} />
			{starCount !== null && (
				<div className="hidden md:flex items-center gap-1 rounded-md border bg-fd-secondary/50 px-1.5 py-0.5 text-xs font-medium text-fd-secondary-foreground transition-colors group-hover:bg-fd-secondary/80">
					<Star className="size-3" />
					<span>{starCount.toLocaleString()}</span>
				</div>
			)}
		</a>
	);
}
