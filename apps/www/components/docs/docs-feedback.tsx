"use client";

import { ThumbsUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
	type FormEventHandler,
	useEffect,
	useEffectEvent,
	useRef,
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
 * Reaction-first feedback popover (Netflix-style dislike / like / love).
 * Message field appears after a reaction is chosen; message stays required.
 * `onEmotionSelect` lets the TOC star CTA react to a heart tap.
 */
export function DocsFeedbackButton({
	pageTitle,
	onEmotionSelect,
	popoverSide = "top",
}: {
	pageTitle: string;
	onEmotionSelect?: (emotion: DocsFeedbackEmotion) => void;
	/** Prefer `bottom` when the trigger sits near the top of the viewport (empty TOC). */
	popoverSide?: "top" | "bottom";
}) {
	const pathname = usePathname();
	const storageKey = `docs-feedback-${pathname}`;
	const [open, setOpen] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [emotion, setEmotion] = useState<DocsFeedbackEmotion | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [githubUrl, setGithubUrl] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const messageRef = useRef<HTMLTextAreaElement>(null);

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

	useEffect(() => {
		if (emotion) {
			messageRef.current?.focus();
		}
	}, [emotion]);

	const resetForm = () => {
		setEmotion(null);
		setMessage("");
		setError(null);
	};

	const submit: FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		if (!emotion || message.trim().length === 0) return;

		setError(null);

		startTransition(async () => {
			const feedback: DocsPageFeedback = {
				url: window.location.href,
				pageTitle,
				opinion: emotion,
				message: message.trim(),
			};

			const response = await submitDocsFeedback(feedback);

			if (!response.success || !response.githubUrl) {
				setError(response.error ?? "Could not submit feedback. Try again.");
				return;
			}

			localStorage.setItem(
				storageKey,
				JSON.stringify({ githubUrl: response.githubUrl }),
			);
			setGithubUrl(response.githubUrl);
			setSubmitted(true);
			resetForm();
		});
	};

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next && !submitted) resetForm();
			}}
		>
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
				align="end"
				side={popoverSide}
				sideOffset={8}
				collisionPadding={16}
				// Shared popover caps height at leftover space beside the trigger, which
				// shrinks this widget into a scrollbar when the TOC rail sits near the
				// top. 80vh is large enough to avoid that, but still lets the form
				// scroll on short viewports instead of clipping off-screen.
				className="w-72 max-h-[80vh] rounded-md border-fd-border bg-fd-popover p-0 text-fd-popover-foreground shadow-md backdrop-blur-none"
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
							<div className="flex flex-col gap-2 border-b border-fd-border bg-fd-muted/40 p-3">
								<p className="text-sm font-medium">How was this page?</p>
								<div className="flex items-center justify-between gap-1">
									{docsFeedbackEmotions.map((e) => (
										<Button
											key={e.name}
											type="button"
											size="sm"
											variant="ghost"
											aria-label={e.label}
											aria-pressed={emotion === e.name}
											className={cn(
												"h-9 flex-1 px-2 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground",
												emotion === e.name && "bg-fd-accent text-fd-foreground",
											)}
											onClick={() => {
												setEmotion(e.name);
												setError(null);
												onEmotionSelect?.(e.name);
											}}
										>
											<span
												aria-hidden="true"
												className="text-base leading-none"
											>
												{e.emoji}
											</span>
											<span className="sr-only">{e.label}</span>
										</Button>
									))}
								</div>
							</div>

							{emotion ? (
								<>
									<div className="p-2">
										<textarea
											ref={messageRef}
											aria-label="Feedback"
											autoComplete="off"
											required
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											placeholder="Tell us more…"
											className="field-sizing-content max-h-48 min-h-24 w-full resize-none rounded-md border border-fd-border bg-transparent px-3 py-2 text-sm text-fd-foreground shadow-none outline-none placeholder:text-fd-muted-foreground focus-visible:border-fd-border focus-visible:ring-1 focus-visible:ring-fd-border"
											onKeyDown={(e) => {
												if (!e.shiftKey && e.key === "Enter") {
													e.currentTarget.form?.requestSubmit();
												}
											}}
										/>
									</div>
									{error ? (
										<p className="px-2 pb-1 text-xs text-red-500" role="alert">
											{error}
										</p>
									) : null}
									<div className="flex justify-end border-t border-fd-border p-2">
										<Button
											type="submit"
											size="sm"
											disabled={isPending || !message.trim()}
											className="bg-fd-foreground text-fd-background hover:bg-fd-foreground/90"
										>
											{isPending ? "Sending…" : "Send"}
										</Button>
									</div>
								</>
							) : null}
						</form>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
