"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, Copy } from "lucide-react";
import { useCopyCommand } from "~/hooks/use-copy-command";
import { getGithubRepoUrl } from "~/lib/github-links";

const INSTALL_COMMAND = "npx arkenv@latest init";

const INSTALL_PROMPT =
	"Set up ArkEnv with `npx arkenv@latest init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.";

export function InstallPanel() {
	const commandCopy = useCopyCommand(INSTALL_COMMAND, {
		successDescription: "Command copied to clipboard!",
	});
	const promptCopy = useCopyCommand(INSTALL_PROMPT, {
		successDescription: "Prompt copied to clipboard!",
	});

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
				<code className="home-aurora__install-code">
					<span className="home-aurora__install-prompt-token">npx </span>
					<span>arkenv@latest init</span>
				</code>
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
					data-state={promptCopy.copied ? "success" : undefined}
					onClick={promptCopy.copy}
				>
					{promptCopy.copied ? (
						<Check className="home-aurora__install-icon" aria-hidden="true" />
					) : (
						<Copy className="home-aurora__install-icon" aria-hidden="true" />
					)}
					{promptCopy.copied ? "Copied" : "Copy agent prompt"}
				</button>
				<a
					className="home-aurora__install-prompt"
					href={getGithubRepoUrl()}
					target="_blank"
					rel="noopener noreferrer"
				>
					<SiGithub className="home-aurora__install-icon" aria-hidden="true" />
					View repo
				</a>
			</div>
		</div>
	);
}
