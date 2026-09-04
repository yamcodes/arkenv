"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Star } from "lucide-react";
import { env } from "~/env";
import { useGithubStarCount } from "~/lib/use-github-star-count";
import { cn } from "~/lib/utils";
import { breakDownGithubUrl } from "~/lib/utils/github";

/**
 * Single GitHub badge: icon (+ optional star count) in one hit target.
 */
export function HeaderGithubLink({
	className,
	iconClassName,
}: {
	className?: string;
	iconClassName?: string;
}) {
	const starCount = useGithubStarCount();
	const { owner, repo } = breakDownGithubUrl(env.NEXT_PUBLIC_GITHUB_URL);

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
