import "./roadmap.css";
import type { Metadata } from "next";
import { SiteFooter } from "~/components/site-footer";
import { fetchRoadmap } from "~/lib/roadmap/fetch-roadmap";
import type { RoadmapItem } from "~/lib/roadmap/types";

export const metadata: Metadata = {
	title: "v1 Roadmap | ArkEnv",
	description:
		"ArkEnv v1 checklist from the GitHub milestone, plus launch steps.",
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
					<h1 className="roadmap-page__title-heading">v1 Roadmap</h1>
					{roadmap.stale ? (
						<p className="roadmap-page__stale">
							GitHub did not respond. You are seeing launch extras only. See the{" "}
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
				</header>

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
					Help with tests, docs, or triage. Open an issue with a clear repro, or
					take something from the{" "}
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
