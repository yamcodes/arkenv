import Image from "next/image";
import { getAuthorAvatarUrl, getAuthorGithub } from "~/lib/blog-author";
import { cn } from "~/lib/utils";

export function formatBlogDate(
	date: string | Date,
	month: "short" | "long" = "short",
): string {
	const value = typeof date === "string" ? new Date(date) : date;
	return value.toLocaleDateString("en-US", {
		year: "numeric",
		month,
		day: "numeric",
		timeZone: "UTC",
	});
}

function dateTimeValue(date: string | Date): string {
	if (typeof date === "string") return date.slice(0, 10);
	return date.toISOString().slice(0, 10);
}

/**
 * Author + date row. `linked` is off inside another link (the index list).
 */
export function BlogByline({
	author,
	authorGithub,
	date,
	size = "md",
	linked = true,
	className,
}: {
	author: string;
	authorGithub?: string;
	date: string | Date;
	size?: "sm" | "md";
	linked?: boolean;
	className?: string;
}) {
	const githubHandle = getAuthorGithub(author, authorGithub);
	const avatarSize = size === "sm" ? 20 : 32;
	const avatarUrl = githubHandle
		? getAuthorAvatarUrl(githubHandle, avatarSize * 2)
		: undefined;
	const githubUrl =
		linked && githubHandle ? `https://github.com/${githubHandle}` : undefined;
	const avatar = avatarUrl ? (
		<Image
			src={avatarUrl}
			alt=""
			width={avatarSize}
			height={avatarSize}
			sizes={`${avatarSize}px`}
			className="blog-byline__avatar"
			preload={size === "md"}
		/>
	) : null;

	return (
		<div
			className={cn(
				"blog-byline",
				size === "sm" && "blog-byline--sm",
				className,
			)}
		>
			{avatar && githubUrl ? (
				<a
					href={githubUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="blog-byline__avatar-link"
					aria-label={`${author} on GitHub`}
					data-no-underline
					data-no-arrow
				>
					{avatar}
				</a>
			) : (
				avatar
			)}
			<span className="blog-byline__text">
				{githubUrl ? (
					<a
						href={githubUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="blog-byline__name"
						data-no-underline
						data-no-arrow
					>
						{author}
					</a>
				) : (
					<span className="blog-byline__name">{author}</span>
				)}
				<span aria-hidden="true">·</span>
				<time dateTime={dateTimeValue(date)}>
					{formatBlogDate(date, size === "sm" ? "short" : "long")}
				</time>
			</span>
		</div>
	);
}
