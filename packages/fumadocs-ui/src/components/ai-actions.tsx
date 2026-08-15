"use client";

import {
	SiClaude,
	SiCursor,
	SiGithub,
	SiMarkdown,
} from "@icons-pack/react-simple-icons";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import { ArrowUpRight, Check, ChevronDown, Copy } from "lucide-react";
import {
	type MouseEventHandler,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { cn } from "@/utils/cn";

const pageTextCache = new Map<string, string>();

const controlClassName = cn(
	buttonVariants({
		color: "secondary",
		size: "sm",
	}),
	"border border-fd-border bg-fd-secondary/40 hover:bg-fd-accent",
);

const compactLinkClassName =
	"inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring [&_svg]:size-3.5 [&_svg]:shrink-0";

const menuRowClassName =
	"flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring";

type Viewport = "desktop" | "mobile";

type ChatLink = {
	id: string;
	label: string;
	description: string;
	icon: ReactNode;
	href: (prompt: string) => string;
};

/**
 * ChatGPT mark. Simple Icons does not ship OpenAI / ChatGPT brand icons.
 */
function ChatGptMark({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.182a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.046 6.046 0 0 0 6.505 2.9 5.985 5.985 0 0 0 5.226 2.965 6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.814 3.354-2.02 1.168a.076.076 0 0 1-.071.006l-4.776-2.758A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071-.006l4.776 2.758a4.494 4.494 0 0 1-.676 8.104v-5.677a.79.79 0 0 0-.407-.668zm2.01-3.023-.142-.085-4.773-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.77-2.757a4.5 4.5 0 0 1 6.68 4.66zM8.306 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.074a4.5 4.5 0 0 1 7.376-3.454l-.142.08L8.704 5.459a.795.795 0 0 0-.393.681zm1.098-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
		</svg>
	);
}

const brandIconProps = {
	"aria-hidden": true,
	className: "size-4 shrink-0",
	size: 16,
	title: "",
} as const;

const chatLinks: ChatLink[] = [
	{
		id: "chatgpt",
		label: "Open in ChatGPT",
		description: "Ask ChatGPT about this page",
		icon: <ChatGptMark className="size-4 shrink-0" />,
		href: (prompt) =>
			`https://chatgpt.com/?${new URLSearchParams({
				hints: "search",
				q: prompt,
			}).toString()}`,
	},
	{
		id: "claude",
		label: "Open in Claude",
		description: "Ask Claude about this page",
		icon: <SiClaude {...brandIconProps} />,
		href: (prompt) =>
			`https://claude.ai/new?${new URLSearchParams({ q: prompt }).toString()}`,
	},
	{
		id: "cursor",
		label: "Open in Cursor",
		description: "Ask Cursor about this page",
		icon: <SiCursor {...brandIconProps} />,
		href: (prompt) => {
			const url = new URL("https://cursor.com/link/prompt");
			url.searchParams.set("text", prompt);
			return url.toString();
		},
	},
];

/**
 * Resolve a docs path against the current origin for chat prompts.
 *
 * @param href Page URL, absolute or site-relative
 * @param origin Optional origin used to resolve relative URLs
 * @returns Absolute URL when an origin is available
 */
function resolvePageHref(href: string, origin?: string): string {
	return origin ? new URL(href, origin).toString() : href;
}

function ExternalMark() {
	return (
		<ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 opacity-50" />
	);
}

function MenuRow({
	description,
	external,
	icon,
	label,
}: {
	description?: string;
	external?: boolean;
	icon: ReactNode;
	label: string;
}) {
	return (
		<>
			<span className="text-fd-muted-foreground">{icon}</span>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
				<span className="text-fd-foreground">{label}</span>
				{description ? (
					<span className="text-xs text-fd-muted-foreground">
						{description}
					</span>
				) : null}
			</span>
			<span
				aria-hidden="true"
				className="flex size-3.5 shrink-0 items-center justify-center"
			>
				{external ? <ExternalMark /> : null}
			</span>
		</>
	);
}

export type AIActionsProps = {
	markdownUrl: string;
	githubUrl: string;
	/**
	 * Canonical docs page URL used in "open in chat" prompts.
	 * Defaults to `markdownUrl` with a trailing `.md` / `.mdx` stripped.
	 */
	pageUrl?: string;
	/**
	 * Which variant to render. Omit to render both; CSS at 48rem (same as
	 * the docs sidebar) hides the inactive one. Use `"desktop"` beside the
	 * title and `"mobile"` below the description.
	 */
	only?: Viewport;
	className?: string;
};

/**
 * Copy the current docs page and offer Markdown, chat, and GitHub shortcuts.
 *
 * @param markdownUrl URL that returns the page Markdown
 * @param githubUrl Edit-on-GitHub URL for this page
 * @param pageUrl Canonical docs page URL used in chat prompts
 * @param only Optional viewport variant to render
 * @param className Optional class name for the root element
 */
export function AIActions({
	markdownUrl,
	githubUrl,
	pageUrl,
	only,
	className,
}: AIActionsProps) {
	const [origin, setOrigin] = useState<string | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState<string | null>(null);

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	useEffect(() => {
		if (!copied && !copyError) return;
		const id = window.setTimeout(() => {
			setCopied(false);
			setCopyError(null);
		}, 1500);
		return () => window.clearTimeout(id);
	}, [copied, copyError]);

	const loadPageText = useCallback(async () => {
		const cached = pageTextCache.get(markdownUrl);
		if (cached) return cached;

		const response = await fetch(markdownUrl);
		if (!response.ok) {
			throw new Error(`Failed to load page text: ${response.statusText}`);
		}
		const content = await response.text();
		pageTextCache.set(markdownUrl, content);
		return content;
	}, [markdownUrl]);

	const copyPage = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(await loadPageText());
			setCopyError(null);
			setCopied(true);
		} catch (error) {
			console.error("Failed to copy page", error);
			setCopied(false);
			setCopyError("Couldn't copy page");
		}
	}, [loadPageText]);

	const openMarkdown = useCallback(() => {
		window.open(markdownUrl, "_blank", "noopener,noreferrer");
		setMenuOpen(false);
	}, [markdownUrl]);

	const copyAndClose: MouseEventHandler = useCallback(() => {
		void copyPage();
		setMenuOpen(false);
	}, [copyPage]);

	const canonicalUrl = pageUrl ?? markdownUrl.replace(/\.mdx?$/, "");
	const chatPrompt = useMemo(() => {
		const href = resolvePageHref(canonicalUrl, origin ?? undefined);
		return `Read this page, I want to ask questions about it. ${href}`;
	}, [canonicalUrl, origin]);

	const CopyIcon = copied ? Check : Copy;
	const copyLabel = copyError
		? "Couldn't copy"
		: copied
			? "Copied"
			: "Copy page";
	const copyStatus = copied
		? "Page copied"
		: copyError
			? "Couldn't copy page"
			: "";

	return (
		<>
			{only !== "mobile" ? (
				<div data-docs-ai-actions="desktop" className={className}>
					<div className="flex">
						<button
							type="button"
							className={cn(
								controlClassName,
								"rounded-l-md rounded-r-none gap-2",
							)}
							onClick={copyAndClose}
						>
							<CopyIcon className="size-4" />
							{copyLabel}
						</button>
						<Popover open={menuOpen} onOpenChange={setMenuOpen}>
							<PopoverTrigger
								aria-label="More page actions"
								className={cn(
									controlClassName,
									"rounded-l-none rounded-r-md border-l-0 px-2",
								)}
							>
								<ChevronDown className="size-4" />
							</PopoverTrigger>
							<PopoverContent
								align="end"
								className="p-1"
								sideOffset={8}
								style={{ width: "max-content" }}
							>
								<div className="flex flex-col">
									<button
										type="button"
										className={menuRowClassName}
										onClick={copyAndClose}
									>
										<MenuRow
											description="Copy page as Markdown for LLMs"
											icon={<CopyIcon className="size-4" />}
											label={copyLabel}
										/>
									</button>
									<button
										type="button"
										className={menuRowClassName}
										onClick={openMarkdown}
									>
										<MenuRow
											description="Open this page as plain text"
											external
											icon={<SiMarkdown {...brandIconProps} />}
											label="View as Markdown"
										/>
									</button>
									{chatLinks.map((link) => (
										<a
											key={link.id}
											href={link.href(chatPrompt)}
											rel="noreferrer noopener"
											target="_blank"
											data-no-underline
											data-no-arrow
											className={menuRowClassName}
											onClick={() => setMenuOpen(false)}
										>
											<MenuRow
												description={link.description}
												external
												icon={link.icon}
												label={link.label}
											/>
										</a>
									))}
									{githubUrl ? (
										<a
											href={githubUrl}
											rel="noreferrer noopener"
											target="_blank"
											data-no-underline
											data-no-arrow
											className={menuRowClassName}
											onClick={() => setMenuOpen(false)}
										>
											<MenuRow
												description="Suggest changes to this page"
												external
												icon={<SiGithub {...brandIconProps} />}
												label="Edit this page on GitHub"
											/>
										</a>
									) : null}
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			) : null}
			{only !== "desktop" ? (
				<div
					data-docs-ai-actions="mobile"
					className={cn(
						"flex flex-wrap items-center gap-x-3 gap-y-2",
						className,
					)}
				>
					<button
						type="button"
						className={compactLinkClassName}
						onClick={() => {
							void copyPage();
						}}
					>
						<CopyIcon />
						<span>
							{copied ? "Copied" : copyError ? "Couldn't copy" : "Copy for LLM"}
						</span>
					</button>
					<span aria-hidden="true" className="h-4 w-px shrink-0 bg-fd-border" />
					<button
						type="button"
						className={compactLinkClassName}
						onClick={openMarkdown}
					>
						<SiMarkdown aria-hidden="true" size={14} title="" />
						<span>View Markdown</span>
						<ExternalMark />
					</button>
					{githubUrl ? (
						<>
							<span
								aria-hidden="true"
								className="h-4 w-px shrink-0 bg-fd-border"
							/>
							<a
								href={githubUrl}
								rel="noreferrer noopener"
								target="_blank"
								data-no-underline
								data-no-arrow
								className={compactLinkClassName}
							>
								<SiGithub aria-hidden="true" size={14} title="" />
								<span>Edit on GitHub</span>
								<ExternalMark />
							</a>
						</>
					) : null}
				</div>
			) : null}
			<span aria-live="polite" className="sr-only">
				{copyStatus}
			</span>
		</>
	);
}
