import {
	ROADMAP_EXCLUDE_ISSUE_NUMBERS,
	ROADMAP_EXTRAS,
	ROADMAP_MILESTONE_NUMBER,
} from "~/lib/roadmap/config";
import type { RoadmapData, RoadmapItem } from "~/lib/roadmap/types";
import { breakDownGithubUrl } from "~/lib/utils/github";

type GitHubMilestone = {
	number: number;
	title: string;
	html_url: string;
	open_issues: number;
	closed_issues: number;
};

type GitHubIssue = {
	number: number;
	title: string;
	state: "open" | "closed";
	html_url: string;
	pull_request?: unknown;
};

function githubHeaders(): HeadersInit {
	const headers: HeadersInit = {
		Accept: "application/vnd.github+json",
		"User-Agent": "arkenv-website",
	};
	const githubToken = process.env.GITHUB_TOKEN;
	if (githubToken) {
		headers.Authorization = githubToken.startsWith("ghp_")
			? `token ${githubToken}`
			: `Bearer ${githubToken}`;
	}
	return headers;
}

function repoCoords(): { owner: string; repo: string } {
	const githubUrl =
		process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/yamcodes/arkenv";
	return breakDownGithubUrl(githubUrl);
}

/**
 * Paginate milestone issues (issues only — PRs on the milestone are skipped).
 */
async function fetchMilestoneIssues(
	owner: string,
	repo: string,
	milestone: number,
): Promise<GitHubIssue[]> {
	const issues: GitHubIssue[] = [];
	let page = 1;
	for (;;) {
		const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`);
		url.searchParams.set("milestone", String(milestone));
		url.searchParams.set("state", "all");
		url.searchParams.set("per_page", "100");
		url.searchParams.set("page", String(page));

		const response = await fetch(url, {
			headers: githubHeaders(),
			next: { revalidate: 300 },
		});
		if (!response.ok) {
			throw new Error(
				`GitHub milestone issues failed: ${response.status} ${response.statusText}`,
			);
		}
		const batch = (await response.json()) as GitHubIssue[];
		issues.push(...batch);
		if (batch.length < 100) break;
		page += 1;
	}
	return issues.filter((issue) => issue.pull_request == null);
}

async function fetchMilestoneMeta(
	owner: string,
	repo: string,
	milestone: number,
): Promise<GitHubMilestone> {
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/milestones/${milestone}`,
		{
			headers: githubHeaders(),
			next: { revalidate: 300 },
		},
	);
	if (!response.ok) {
		throw new Error(
			`GitHub milestone failed: ${response.status} ${response.statusText}`,
		);
	}
	return (await response.json()) as GitHubMilestone;
}

function extrasAsItems(): RoadmapItem[] {
	return ROADMAP_EXTRAS.map((extra) => ({
		id: `extra:${extra.id}`,
		title: extra.title,
		done: extra.done,
	}));
}

function sortItems(items: RoadmapItem[]): RoadmapItem[] {
	return [...items].sort((a, b) => {
		if (a.done !== b.done) return a.done ? 1 : -1;
		const aNum = a.number ?? Number.POSITIVE_INFINITY;
		const bNum = b.number ?? Number.POSITIVE_INFINITY;
		if (aNum !== bNum) return aNum - bNum;
		return a.title.localeCompare(b.title);
	});
}

function withProgress(
	items: RoadmapItem[],
	milestone: RoadmapData["milestone"],
	stale: boolean,
): RoadmapData {
	const totalCount = items.length;
	const doneCount = items.filter((item) => item.done).length;
	const percent =
		totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
	return {
		milestone,
		items: sortItems(items),
		doneCount,
		totalCount,
		percent,
		stale,
	};
}

/**
 * Build the public roadmap from the GitHub v1 milestone plus local extras.
 */
export async function fetchRoadmap(): Promise<RoadmapData> {
	const { owner, repo } = repoCoords();
	const fallbackMilestone = {
		number: ROADMAP_MILESTONE_NUMBER,
		title: "v1",
		url: `https://github.com/${owner}/${repo}/milestone/${ROADMAP_MILESTONE_NUMBER}`,
	};

	try {
		const [meta, issues] = await Promise.all([
			fetchMilestoneMeta(owner, repo, ROADMAP_MILESTONE_NUMBER),
			fetchMilestoneIssues(owner, repo, ROADMAP_MILESTONE_NUMBER),
		]);

		const milestoneItems: RoadmapItem[] = issues
			.filter((issue) => !ROADMAP_EXCLUDE_ISSUE_NUMBERS.has(issue.number))
			.map((issue) => ({
				id: `issue:${issue.number}`,
				title: issue.title,
				done: issue.state === "closed",
				href: issue.html_url,
				number: issue.number,
			}));

		return withProgress(
			[...milestoneItems, ...extrasAsItems()],
			{
				number: meta.number,
				title: meta.title,
				url: meta.html_url,
			},
			false,
		);
	} catch {
		return withProgress([...extrasAsItems()], fallbackMilestone, true);
	}
}
