import { AnnouncementBadge } from "~/components/announcement-badge";
import "./roadmap-progress-card.css";

/**
 * v1 progress chip in the hero announcement slot. Uses `AnnouncementBadge`
 * for chrome + arrow; only the meter content is custom.
 *
 * When `stale`, the extras-only fallback would otherwise report `0%` — show a
 * neutral track with no percent so the marketing hero does not claim a wrong number.
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
		<AnnouncementBadge href="/roadmap" aria-label={ariaLabel}>
			<span className="roadmap-progress-card">
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
			</span>
		</AnnouncementBadge>
	);
}
