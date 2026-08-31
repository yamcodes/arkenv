"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowUpRight, BookOpen, Check, Copy } from "lucide-react";
import { SparklesIcon } from "~/components/icons/sparkles-icon";
import { useCopyCommand } from "~/hooks/use-copy-command";
import { getGithubRepoUrl } from "~/lib/github-links";

const INSTALL_COMMAND = "npx arkenv init";

const INSTALL_PROMPT =
	"Set up ArkEnv with `npx arkenv init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.";

type InstallPanelProps = {
	variant?: "hero" | "outro";
};

export function InstallPanel({ variant = "hero" }: InstallPanelProps) {
	const commandCopy = useCopyCommand(INSTALL_COMMAND, {
		successDescription: "Command copied to clipboard!",
	});
	const promptCopy = useCopyCommand(INSTALL_PROMPT, {
		successDescription: "Prompt copied to clipboard!",
	});
	const isOutro = variant === "outro";

	return (
		<div className="home-aurora__install">
			<button
				type="button"
				aria-label={commandCopy.copied ? "Copied" : "Copy install command"}
				onClick={commandCopy.copy}
				className="home-aurora__install-copy"
				data-state={commandCopy.copied ? "success" : undefined}
			>
				<span className="home-aurora__install-prompt-symbol" aria-hidden="true">
					$
				</span>
				<code className="home-aurora__install-code">npx arkenv init</code>
				<span
					className="home-aurora__install-copy-affordance"
					aria-hidden="true"
				>
					{commandCopy.copied ? (
						<Check className="size-4 text-[var(--color-success)]" />
					) : (
						<Copy className="size-4" />
					)}
				</span>
			</button>
			<div className="home-aurora__install-links">
				<button
					type="button"
					className="home-aurora__install-prompt"
					onClick={promptCopy.copy}
				>
					{promptCopy.copied ? (
						<Check
							className="home-aurora__install-icon home-aurora__install-icon--success"
							aria-hidden="true"
						/>
					) : (
						<SparklesIcon className="home-aurora__install-icon" />
					)}
					Copy prompt
				</button>
				{isOutro ? (
					<a href="/docs" className="home-aurora__install-prompt">
						<BookOpen
							className="home-aurora__install-icon"
							aria-hidden="true"
						/>
						Read the docs
					</a>
				) : (
					<a
						className="home-aurora__install-prompt"
						href={getGithubRepoUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						<SiGithub
							className="home-aurora__install-icon"
							aria-hidden="true"
						/>
						View repo
						<ArrowUpRight
							className="site-nav__external-icon"
							aria-hidden="true"
						/>
					</a>
				)}
			</div>
		</div>
	);
}
