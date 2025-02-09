
import Link from "next/link";
import { SquarePen } from "lucide-react";
import { Button } from "../ui/button";

const getLinkTitleAndHref = (path?: string) => {
	try {
		if (!path) throw new Error("Path is required");
		const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
		if (!githubUrl) throw new Error("NEXT_PUBLIC_GITHUB_URL is not configured");
		const defaultBranch = process.env.NEXT_PUBLIC_GITHUB_BRANCH ?? "main";
		const cleanUrl = githubUrl.replace(/\/$/, "");
		// Use URL API for robust parsing
		const url = new URL(cleanUrl);
		const [owner, repo] = url.pathname.split("/").filter(Boolean).slice(-2);
		if (!owner || !repo) throw new Error("Invalid GitHub URL format");
		const title = `Editing ${repo}/${path} at ${defaultBranch} · ${owner}/${repo}`;
		const href = `${githubUrl}/edit/${defaultBranch}/${path}`;
		return { title, href };
	} catch {
		return { title: "Edit this page on GitHub", href: "#" };
	}
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
}

export const EditOnGithub = ({ path }: EditOnGithubProps) => {
  return (
		<Button asChild variant="link" className="p-0">
			<Link
				{...getLinkTitleAndHref(`apps/docs/content/docs/${path}`)}
				target="_blank"
				rel="noopener noreferrer"
  >
				<SquarePen className="w-4 h-4" />
				Edit this page on GitHub
			</Link>
		</Button>
	);
};
