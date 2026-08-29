import "./roadmap.css";
import type { Metadata } from "next";
import { SiteFooter } from "~/components/site-footer";
import { fetchRoadmap } from "~/lib/roadmap/fetch-roadmap";
import { groupByTopic } from "~/lib/roadmap/topics";
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
					data-no-underline
					data-no-arrow
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

function RoadmapTopicGroups({
	items,
	sectionId,
}: {
	items: RoadmapItem[];
	sectionId: string;
}) {
	const groups = groupByTopic(items);
	return (
		<div className="roadmap-page__topics">
			{groups.map(({ topic, items: topicItems }) => {
				const topicId = `${sectionId}-${topic.toLowerCase()}`;
				return (
					<div key={topic} className="roadmap-page__topic">
						<h3 id={topicId} className="roadmap-page__topic-title">
							{topic}
							<span className="roadmap-page__count">{topicItems.length}</span>
						</h3>
						<ul className="roadmap-page__list" aria-labelledby={topicId}>
							{topicItems.map((item) => (
								<RoadmapRow key={item.id} item={item} />
							))}
						</ul>
					</div>
				);
			})}
		</div>
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
								data-no-underline
								data-no-arrow
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
						<RoadmapTopicGroups items={openItems} sectionId="roadmap-open" />
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
						<RoadmapTopicGroups items={doneItems} sectionId="roadmap-done" />
					</section>
				) : null}
			</article>
			<SiteFooter reveal />
		</div>
	);
}
