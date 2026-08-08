"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Star } from "lucide-react";
import { DotGrid } from "~/components/page/dot-grid";
import { getGithubRepoUrl } from "~/lib/github-links";
import { useGithubStarCount } from "~/lib/use-github-star-count";
import { cn } from "~/lib/utils/cn";
import "./docs-star-card.css";

/**
 * TOC rail CTA to star the repo — home-outro atmosphere + direct copy.
 * `spotlight` pulses a YouTube-style glow when the feedback heart is tapped.
 */
export function DocsStarCard({
	spotlight = false,
	onSpotlightEnd,
}: {
	spotlight?: boolean;
	onSpotlightEnd?: () => void;
}) {
	const starCount = useGithubStarCount();
	const githubUrl = getGithubRepoUrl();

	const label =
		starCount !== null
			? `Star ArkEnv on GitHub · ${starCount.toLocaleString()} stars`
			: "Star ArkEnv on GitHub";

	return (
		<a
			href={githubUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={label}
			className={cn(
				"docs-star-card group",
				spotlight && "docs-star-card--spotlight",
			)}
			onAnimationEnd={(event) => {
				if (
					event.target === event.currentTarget &&
					event.animationName.startsWith("docs-star-spotlight")
				) {
					onSpotlightEnd?.();
				}
			}}
		>
			<span className="docs-star-card__atmosphere" aria-hidden="true">
				<DotGrid spacing={14} radius={0.75} />
			</span>

			<span className="docs-star-card__body">
				<span className="docs-star-card__eyebrow">
					<span className="docs-star-card__eyebrow-label">
						<SiGithub aria-hidden="true" className="size-3 shrink-0" />
						GitHub
					</span>
					{starCount !== null ? (
						<span className="docs-star-card__count">
							{starCount.toLocaleString()}
						</span>
					) : null}
				</span>

				<span className="docs-star-card__title">
					<Star
						aria-hidden="true"
						className="docs-star-card__title-star"
						fill="currentColor"
					/>
					Enjoying ArkEnv?
				</span>

				<span className="docs-star-card__cta">
					Leave a star
					<span aria-hidden="true"> →</span>
				</span>
			</span>
		</a>
	);
}
