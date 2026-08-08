"use client";

import { SiMarkdown } from "@icons-pack/react-simple-icons";
import { ThumbsUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
	type FormEventHandler,
	useEffect,
	useEffectEvent,
	useState,
	useTransition,
} from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { submitDocsFeedback } from "~/lib/docs-feedback/action";
import {
	type DocsFeedbackEmotion,
	docsFeedbackEmotions,
} from "~/lib/docs-feedback/emotions";
import type { DocsPageFeedback } from "~/lib/docs-feedback/schema";
import { cn } from "~/lib/utils/cn";

/**
 * Geist Docs / Turborepo-style feedback popover.
 * Submit path mirrors Fumadocs: opinion + message → server action → thank-you,
 * with GitHub as the durable sink (issue create or prefilled new-issue tab).
 */
export function DocsFeedbackButton({ pageTitle }: { pageTitle: string }) {
	const pathname = usePathname();
	const storageKey = `docs-feedback-${pathname}`;
	const [open, setOpen] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [emotion, setEmotion] = useState<DocsFeedbackEmotion | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [githubUrl, setGithubUrl] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const restore = useEffectEvent((key: string) => {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) {
				setSubmitted(false);
				setGithubUrl(null);
				return;
			}
			const parsed = JSON.parse(raw) as { githubUrl?: string };
			setSubmitted(true);
			setGithubUrl(parsed.githubUrl ?? null);
		} catch {
			setSubmitted(false);
			setGithubUrl(null);
		}
	});

	useEffect(() => {
		restore(storageKey);
	}, [storageKey]);

	const submit: FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		if (!emotion || message.trim().length === 0) return;

		setError(null);

		// Open a blank tab synchronously so popup blockers allow the GitHub
		// destination after the async server action (prefill / created issue).
		const pendingTab = window.open("about:blank", "_blank");

		startTransition(async () => {
			const feedback: DocsPageFeedback = {
				url: window.location.href,
				pageTitle,
				opinion: emotion,
				message: message.trim(),
			};

			const response = await submitDocsFeedback(feedback);

			if (!response.success || !response.githubUrl) {
				pendingTab?.close();
				setError(response.error ?? "Could not submit feedback. Try again.");
				return;
			}

			localStorage.setItem(
				storageKey,
				JSON.stringify({ githubUrl: response.githubUrl }),
			);
			setGithubUrl(response.githubUrl);
			setSubmitted(true);
			setMessage("");
			setEmotion(null);

			if (pendingTab) {
				pendingTab.location.href = response.githubUrl;
			} else {
				window.open(response.githubUrl, "_blank", "noopener,noreferrer");
			}
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
				>
					<ThumbsUpIcon className="size-3.5" aria-hidden="true" />
					<span>Give feedback</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				side="top"
				sideOffset={8}
				className="w-72 overflow-hidden rounded-lg border-fd-border bg-fd-popover p-0 text-fd-popover-foreground shadow-md backdrop-blur-none"
			>
				<div className="overflow-visible">
					{submitted ? (
						<div className="flex flex-col items-center gap-3 bg-fd-muted/40 px-3 py-6 text-center text-sm">
							<p>Thank you for your feedback!</p>
							{githubUrl ? (
								<a
									href={githubUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-fd-muted-foreground underline-offset-2 hover:text-fd-foreground hover:underline"
								>
									View on GitHub
								</a>
							) : null}
							<button
								type="button"
								className="text-xs text-fd-muted-foreground hover:text-fd-foreground"
								onClick={() => {
									localStorage.removeItem(storageKey);
									setSubmitted(false);
									setGithubUrl(null);
								}}
							>
								Submit again
							</button>
						</div>
					) : (
						<form className="flex flex-col" onSubmit={submit}>
							<div className="p-2">
								<textarea
									autoFocus
									aria-label="Feedback"
									autoComplete="off"
									required
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Leave your feedback…"
									className="field-sizing-content max-h-48 min-h-24 w-full resize-none rounded-md border border-fd-border bg-transparent px-3 py-2 text-sm text-fd-foreground shadow-none outline-none placeholder:text-fd-muted-foreground focus-visible:border-fd-border focus-visible:ring-1 focus-visible:ring-fd-border"
									onKeyDown={(e) => {
										if (!e.shiftKey && e.key === "Enter") {
											e.currentTarget.form?.requestSubmit();
										}
									}}
								/>
							</div>
							<div className="flex items-center justify-end gap-1 px-2 text-fd-muted-foreground">
								<SiMarkdown className="inline size-3" aria-hidden="true" />
								<p className="text-xs">supported</p>
							</div>
							{error ? (
								<p className="px-2 pb-1 text-xs text-red-500" role="alert">
									{error}
								</p>
							) : null}
							<div className="mt-2 flex items-center justify-between border-t border-fd-border bg-fd-muted/40 p-2">
								<div className="flex items-center gap-px">
									{docsFeedbackEmotions.map((e) => (
										<Button
											key={e.name}
											type="button"
											size="sm"
											variant="ghost"
											aria-label={e.name}
											aria-pressed={emotion === e.name}
											className={cn(
												"h-8 px-2 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground",
												emotion === e.name && "bg-fd-accent text-fd-foreground",
											)}
											onClick={() => setEmotion(e.name)}
										>
											<span aria-hidden="true" className="text-base leading-none">
												{e.emoji}
											</span>
											<span className="sr-only">{e.name}</span>
										</Button>
									))}
								</div>
								<Button
									type="submit"
									size="sm"
									disabled={isPending || !emotion || !message.trim()}
									className="bg-fd-foreground text-fd-background hover:bg-fd-foreground/90"
								>
									{isPending ? "Sending…" : "Send"}
								</Button>
							</div>
						</form>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
