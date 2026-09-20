import Link from "next/link";
import "./roadmap-progress-card.css";

/**
 * v1 progress meter for the docs TOC rail (beside Enjoying ArkEnv).
 * Links to `/roadmap`.
 *
 * When `stale`, the extras-only fallback would otherwise report `0%` — show a
 * neutral track with no percent so the chrome does not claim a wrong number.
 */
export function RoadmapProgressCard({
	percent,
	stale = false,
	label = "v1.0",
}: {
	percent: number;
	/**
	 * True when GitHub could not be reached (`fetchRoadmap` extras-only fallback).
	 */
	stale?: boolean;
	/**
	 * Left-side version label (monospace).
	 */
	label?: string;
}) {
	const clamped = Math.max(0, Math.min(100, Math.round(percent)));
	const ariaLabel = stale
		? "v1 roadmap (progress unavailable)"
		: `v1 roadmap ${clamped}% complete`;

	return (
		<Link
			href="/roadmap"
			data-no-underline
			className="roadmap-progress-card"
			aria-label={ariaLabel}
		>
			<span className="roadmap-progress-card__label">{label}</span>
			<span
				className={
					stale
						? "roadmap-progress-card__track roadmap-progress-card__track--stale"
						: "roadmap-progress-card__track"
				}
				aria-hidden="true"
			>
				{stale ? null : (
					<span
						className="roadmap-progress-card__fill"
						style={{ width: `${clamped}%` }}
					/>
				)}
			</span>
			{stale ? null : (
				<span className="roadmap-progress-card__pct">{clamped}%</span>
			)}
		</Link>
	);
}
