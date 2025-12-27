"use client";

import { captureMessage } from "@sentry/nextjs";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { getLinkTitleAndHref } from "~/lib/utils";
import { Button } from "../ui/button";

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
					{...getLinkTitleAndHref(
						`${process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH ?? "apps/www/content/docs/"}${path}`,
					)}
					target="_blank"
					rel="noopener noreferrer"
					data-no-underline
					data-no-arrow
				>
					<SquarePen
						aria-hidden="true"
						className="w-4 h-4"
						data-testid="square-pen-icon"
					/>
					Edit this page on GitHub
				</Link>
			</Button>
		);
	} catch (error) {
		captureMessage("Could not render GitHub edit button", {
			level: "warning",
			extra: {
				error: error instanceof Error ? error.message : String(error),
			},
		});
		return null;
	}
};
