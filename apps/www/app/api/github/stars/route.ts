import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { breakDownGithubUrl } from "~/lib/utils/github";

type GitHubApiResponse = {
	stargazers_count: number;
};

type GitHubApiError = {
	message: string;
	documentation_url?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(_request: NextRequest) {
	try {
		const githubUrl =
			process.env.NEXT_PUBLIC_GITHUB_URL ??
			"https://github.com/yamcodes/arkenv";
		const { owner, repo } = breakDownGithubUrl(githubUrl);

		const headers: HeadersInit = {
			Accept: "application/vnd.github+json",
			"User-Agent": "arkenv-website",
		};

		// Use GitHub token if available for higher rate limits (5,000/hour vs 60/hour)
		const githubToken = process.env.GITHUB_TOKEN;
		if (githubToken) {
			// Classic PATs (ghp_*) require "token" scheme, fine-grained tokens use "Bearer"
			headers.Authorization = githubToken.startsWith("ghp_")
				? `token ${githubToken}`
				: `Bearer ${githubToken}`;
		}

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}`,
			{
				headers,
				next: { revalidate: 300 }, // Cache for 5 minutes
			},
		);

		if (!response.ok) {
			if (response.status === 403) {
				const error = (await response.json()) as GitHubApiError;
				Sentry.captureMessage(
					`GitHub API rate limit exceeded: ${error.message}`,
					"warning",
				);
				return NextResponse.json(
					{
						error: "Rate limit exceeded",
						retryAfter: response.headers.get("Retry-After"),
					},
					{ status: 503 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch star count" },
				{ status: response.status },
			);
		}

		const data = (await response.json()) as GitHubApiResponse;
		return NextResponse.json({ stars: data.stargazers_count });
	} catch (error) {
		Sentry.captureException(error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
