"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Star } from "lucide-react";
import { env } from "~/env";
import { useGithubStarCount } from "~/lib/use-github-star-count";
import { cn } from "~/lib/utils";
import { breakDownGithubUrl } from "~/lib/utils/github";

type StarUsProps = {
	className?: string;
};

export function StarUsButton({ className }: StarUsProps) {
	const starCount = useGithubStarCount();

	const githubUrl =
		env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/yamcodes/arkenv";
	const { owner, repo } = breakDownGithubUrl(githubUrl);

	return (
		<a
			href={`https://github.com/${owner}/${repo}`}
			target="_blank"
			rel="noopener noreferrer"
			className={cn("home-aurora__mobile-cta home-aurora__star-cta", className)}
		>
			<SiGithub aria-hidden="true" />
			<span>Star us on GitHub</span>
			<Star
				aria-hidden="true"
				className="home-aurora__star-cta-icon"
				fill="currentColor"
			/>
			{starCount !== null && (
				<span className="home-aurora__star-cta-count">
					{starCount.toLocaleString()}
				</span>
			)}
		</a>
	);
}
