import Link from "next/link";
import "./roadmap-progress-card.css";

/**
 * Compact v1 progress chip (Drizzle-style). Links to `/roadmap`.
 */
export function RoadmapProgressCard({
	percent,
	label = "v1.0",
}: {
	percent: number;
	/**
	 * Left-side version label (monospace).
	 */
	label?: string;
}) {
	const clamped = Math.max(0, Math.min(100, Math.round(percent)));

	return (
		<Link
			href="/roadmap"
			className="roadmap-progress-card"
			aria-label={`v1 roadmap ${clamped}% complete`}
		>
			<span className="roadmap-progress-card__label">{label}</span>
			<span
				className="roadmap-progress-card__track"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={clamped}
				aria-hidden="true"
			>
				<span
					className="roadmap-progress-card__fill"
					style={{ width: `${clamped}%` }}
				/>
			</span>
			<span className="roadmap-progress-card__pct">{clamped}%</span>
		</Link>
	);
}
