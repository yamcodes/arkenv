import "./roadmap.css";
import type { Metadata } from "next";
import { SiteFooter } from "~/components/site-footer";
import { fetchRoadmap } from "~/lib/roadmap/fetch-roadmap";
import type { RoadmapItem } from "~/lib/roadmap/types";

export const metadata: Metadata = {
	title: "v1 Roadmap | ArkEnv",
	description:
		"Track ArkEnv v1 progress toward a stable release. Checklist driven by the GitHub v1 milestone.",
};

export const revalidate = 300;

function RoadmapCheck({ done }: { done: boolean }) {
	return (
		<span
			className={
				done
					? "roadmap-page__check roadmap-page__check--done"
					: "roadmap-page__check"
			}
			aria-hidden="true"
		>
			{done ? "✓" : null}
		</span>
	);
}

function RoadmapRow({ item }: { item: RoadmapItem }) {
	const label =
		item.number != null ? (
			<>
				<span className="roadmap-page__num">#{item.number}</span>
				<span className="roadmap-page__title">{item.title}</span>
			</>
		) : (
			<span className="roadmap-page__title">{item.title}</span>
		);

	return (
		<li
			className={
				item.done
					? "roadmap-page__item roadmap-page__item--done"
					: "roadmap-page__item"
			}
		>
			<RoadmapCheck done={item.done} />
			{item.href ? (
				<a
					href={item.href}
					className="roadmap-page__link"
					target="_blank"
					rel="noopener noreferrer"
				>
					{label}
				</a>
			) : (
				<span className="roadmap-page__link roadmap-page__link--static">
					{label}
				</span>
			)}
			<span className="sr-only">{item.done ? "Completed" : "Open"}</span>
		</li>
	);
}

export default async function RoadmapPage() {
	const roadmap = await fetchRoadmap();
	const openItems = roadmap.items.filter((item) => !item.done);
	const doneItems = roadmap.items.filter((item) => item.done);

	return (
		<div className="home-aurora__shell">
			<div className="home-aurora__rails" aria-hidden="true" />
			<article className="roadmap-page">
				<header className="roadmap-page__header">
					<p className="roadmap-page__eyebrow">ArkEnv alpha</p>
					<h1 className="roadmap-page__title-heading">v1 Roadmap</h1>
					<p className="roadmap-page__lede">
						Path to a production-ready, stable v1. Issue rows come from the{" "}
						<a
							href={roadmap.milestone.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{roadmap.milestone.title} milestone
						</a>{" "}
						on GitHub. A few launch steps that are not issues are listed with
						the open work until they ship.
					</p>
				</header>

				<section
					className="roadmap-page__progress"
					aria-labelledby="roadmap-progress-label"
				>
					<div
						className="roadmap-page__bar"
						role="progressbar"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={roadmap.percent}
						aria-labelledby="roadmap-progress-label"
					>
						<div
							className="roadmap-page__bar-fill"
							style={{ width: `${roadmap.percent}%` }}
						/>
					</div>
					<p
						id="roadmap-progress-label"
						className="roadmap-page__progress-meta"
					>
						<span className="roadmap-page__progress-pct">
							{roadmap.percent}%
						</span>
						<span className="roadmap-page__progress-count">
							{roadmap.doneCount} of {roadmap.totalCount} complete
						</span>
					</p>
					{roadmap.stale ? (
						<p className="roadmap-page__stale">
							Could not refresh GitHub right now. Showing manual launch items
							only — check the{" "}
							<a
								href={roadmap.milestone.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								milestone
							</a>{" "}
							for the full list.
						</p>
					) : null}
				</section>

				<section
					className="roadmap-page__criteria"
					aria-labelledby="roadmap-success"
				>
					<h2 id="roadmap-success" className="roadmap-page__section-title">
						What stable looks like
					</h2>
					<ul className="roadmap-page__criteria-list">
						<li>Stable API with a clear deprecation policy</li>
						<li>Solid test coverage across core paths</li>
						<li>Documentation with examples and migration notes</li>
						<li>Clear errors and predictable validation</li>
						<li>Documented MO that the codebase matches</li>
					</ul>
				</section>

				{openItems.length > 0 ? (
					<section
						className="roadmap-page__section"
						aria-labelledby="roadmap-open"
					>
						<h2 id="roadmap-open" className="roadmap-page__section-title">
							Up next
							<span className="roadmap-page__count">{openItems.length}</span>
						</h2>
						<ul className="roadmap-page__list">
							{openItems.map((item) => (
								<RoadmapRow key={item.id} item={item} />
							))}
						</ul>
					</section>
				) : null}

				{doneItems.length > 0 ? (
					<section
						className="roadmap-page__section"
						aria-labelledby="roadmap-done"
					>
						<h2 id="roadmap-done" className="roadmap-page__section-title">
							Done
							<span className="roadmap-page__count">{doneItems.length}</span>
						</h2>
						<ul className="roadmap-page__list">
							{doneItems.map((item) => (
								<RoadmapRow key={item.id} item={item} />
							))}
						</ul>
					</section>
				) : null}

				<p className="roadmap-page__help">
					Want to help? Testing, docs, and triage move the needle most. Open an
					issue with clear repro steps, or pick something from the{" "}
					<a
						href={roadmap.milestone.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						milestone
					</a>
					.
				</p>
			</article>
			<SiteFooter reveal />
		</div>
	);
}
