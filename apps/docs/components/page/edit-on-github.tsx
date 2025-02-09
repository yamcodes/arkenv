"use client";

import { SquarePen } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

const getLinkTitleAndHref = (path: string) => {
	const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
	if (!githubUrl) throw new Error("NEXT_PUBLIC_GITHUB_URL is not configured");
	const defaultBranch = process.env.NEXT_PUBLIC_GITHUB_BRANCH ?? "main";
	const cleanUrl = githubUrl.replace(/\/$/, "");
	const url = new URL(cleanUrl);
	const [owner, repo] = url.pathname.split("/").filter(Boolean).slice(-2);
	if (!owner || !repo) throw new Error("Invalid GitHub URL format");
	const title = `Editing ${repo}/${path} at ${defaultBranch} · ${owner}/${repo}`;
	const href = `${githubUrl}/edit/${defaultBranch}/${path}`;
	return { title, href };
};

type EditOnGithubProps = {
	/**
	 * The path to the file to edit on GitHub.
	 *
	 * @example
	 * ```ts
	 * <EditOnGithub path="/index.mdx" />
	 * ```
	 */
	path: string;
};

export const EditOnGithub = ({ path }: EditOnGithubProps) => {
	try {
		return (
			<Button asChild variant="link" className="p-0">
				<Link
					{...getLinkTitleAndHref(`${process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH ?? 'apps/docs/content/docs/'}${path}`)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<SquarePen className="w-4 h-4" />
					Edit this page on GitHub
				</Link>
			</Button>
		);
	} catch (error) {
		console.warn("Could not render GitHub edit button:", error);
		return null;
	}
};
