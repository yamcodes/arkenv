import { App, type Octokit } from "octokit";
import { breakDownGithubUrl } from "~/lib/utils/github";

/** Must match a Discussion category name in the GitHub repo. */
export const DocsFeedbackCategory = "Docs Feedback";

let octokitInstance: Octokit | undefined;
let cachedDestination: RepositoryInfo | undefined;

type RepositoryInfo = {
	id: string;
	discussionCategories: {
		nodes: {
			id: string;
			name: string;
		}[];
	};
};

function normalizePrivateKey(key: string): string {
	// Vercel / dotenv often store PEM with literal `\n`.
	return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

async function getOctokit(): Promise<Octokit> {
	if (octokitInstance) return octokitInstance;

	const appId = process.env.GITHUB_APP_ID;
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

	if (!appId || !privateKey) {
		throw new Error(
			"Missing GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY — docs feedback cannot post to Discussions.",
		);
	}

	const { owner, repo } = breakDownGithubUrl();
	const app = new App({
		appId,
		privateKey: normalizePrivateKey(privateKey),
	});

	const { data } = await app.octokit.request(
		"GET /repos/{owner}/{repo}/installation",
		{
			owner,
			repo,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);

	octokitInstance = await app.getInstallationOctokit(data.id);
	return octokitInstance;
}

async function getFeedbackDestination(): Promise<RepositoryInfo> {
	if (cachedDestination) return cachedDestination;

	const octokit = await getOctokit();
	const { owner, repo } = breakDownGithubUrl();

	const {
		repository,
	}: {
		repository: RepositoryInfo;
	} = await octokit.graphql(`
  query {
    repository(owner: "${owner}", name: "${repo}") {
      id
      discussionCategories(first: 25) {
        nodes { id name }
      }
    }
  }
`);

	cachedDestination = repository;
	return repository;
}

/**
 * Fumadocs-style sink: one Discussion per docs path (`Feedback for /docs/...`).
 * Reuses the thread and appends a comment when it already exists (authored by the app).
 */
export async function createDocsFeedbackDiscussion(
	pageId: string,
	body: string,
): Promise<string> {
	const octokit = await getOctokit();
	const destination = await getFeedbackDestination();
	const { owner, repo } = breakDownGithubUrl();

	const category = destination.discussionCategories.nodes.find(
		(c) => c.name === DocsFeedbackCategory,
	);

	if (!category) {
		throw new Error(
			`Please create a "${DocsFeedbackCategory}" category in GitHub Discussions.`,
		);
	}

	const title = `Feedback for ${pageId}`;
	const queryResult: {
		search: {
			nodes: { id: string; title: string; url: string }[];
		};
	} = await octokit.graphql(`
          query {
            search(type: DISCUSSION, query: ${JSON.stringify(`"${title}" in:title repo:${owner}/${repo} author:@me`)}, first: 10) {
              nodes {
                ... on Discussion { id, title, url }
              }
            }
          }`);

	const discussion = queryResult.search.nodes.find(
		(item) => item.title === title,
	);

	if (discussion) {
		const result: {
			addDiscussionComment: {
				comment: { id: string; url: string };
			};
		} = await octokit.graphql(`
            mutation {
              addDiscussionComment(input: { body: ${JSON.stringify(body)}, discussionId: "${discussion.id}" }) {
                comment { id, url }
              }
            }`);

		return result.addDiscussionComment.comment.url;
	}

	const result: {
		createDiscussion: {
			discussion: { id: string; url: string };
		};
	} = await octokit.graphql(`
            mutation {
              createDiscussion(input: { repositoryId: "${destination.id}", categoryId: "${category.id}", body: ${JSON.stringify(body)}, title: ${JSON.stringify(title)} }) {
                discussion { id, url }
              }
            }`);

	return result.createDiscussion.discussion.url;
}

/** Build the markdown body posted to the Discussion (or comment). */
export function buildDocsFeedbackBody(input: {
	message: string;
	pageTitle: string;
	url: string;
	emoji: string;
}): string {
	return [
		input.emoji,
		"",
		input.message,
		"",
		`> Forwarded from docs feedback on **${input.pageTitle}**.`,
		`> ${input.url}`,
	].join("\n");
}
