"use client";

import { Check, Copy, Sparkles, Terminal } from "lucide-react";
import { useId, useState } from "react";
import { useCopyCommand } from "~/hooks/use-copy-command";

const INSTALL_COMMAND = "npx arkenv@latest init";

const INSTALL_PROMPT =
	"Set up ArkEnv with `npx arkenv@latest init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.";

type Tab = "command" | "prompt";

export function InstallPanel() {
	const [tab, setTab] = useState<Tab>("command");
	const baseId = useId();
	const commandPanelId = `${baseId}-command`;
	const promptPanelId = `${baseId}-prompt`;
	const commandTabId = `${baseId}-tab-command`;
	const promptTabId = `${baseId}-tab-prompt`;

	const commandCopy = useCopyCommand(INSTALL_COMMAND, {
		successDescription: "Command copied to clipboard!",
	});
	const promptCopy = useCopyCommand(INSTALL_PROMPT, {
		successDescription: "Prompt copied to clipboard!",
	});

	return (
		<div className="home-aurora__install">
			<div
				className="home-aurora__install-tabs"
				role="tablist"
				aria-label="Install method"
			>
				<button
					type="button"
					role="tab"
					id={commandTabId}
					aria-selected={tab === "command"}
					aria-controls={commandPanelId}
					tabIndex={tab === "command" ? 0 : -1}
					className="home-aurora__install-tab"
					data-active={tab === "command" ? "true" : undefined}
					onClick={() => setTab("command")}
				>
					Command
				</button>
				<button
					type="button"
					role="tab"
					id={promptTabId}
					aria-selected={tab === "prompt"}
					aria-controls={promptPanelId}
					tabIndex={tab === "prompt" ? 0 : -1}
					className="home-aurora__install-tab"
					data-active={tab === "prompt" ? "true" : undefined}
					onClick={() => setTab("prompt")}
				>
					<span aria-hidden="true">✨</span> Prompt
				</button>
			</div>

			{tab === "command" ? (
				<div
					role="tabpanel"
					id={commandPanelId}
					aria-labelledby={commandTabId}
					className="home-aurora__install-panel"
				>
					<button
						type="button"
						aria-label={commandCopy.copied ? "Copied" : "Copy install command"}
						onClick={commandCopy.copy}
						className="home-aurora__install-copy"
						data-state={commandCopy.copied ? "success" : undefined}
					>
						<Terminal
							className="home-aurora__install-icon"
							aria-hidden="true"
						/>
						<code className="home-aurora__install-code">
							<span className="home-aurora__install-prompt-token">npx </span>
							<span>arkenv@latest init</span>
						</code>
						<span className="home-aurora__install-copy-affordance">
							{commandCopy.copied ? (
								<Check className="size-5 text-[var(--color-success)]" />
							) : (
								<Copy className="size-5" />
							)}
						</span>
					</button>
				</div>
			) : (
				<div
					role="tabpanel"
					id={promptPanelId}
					aria-labelledby={promptTabId}
					className="home-aurora__install-panel"
				>
					<button
						type="button"
						aria-label={promptCopy.copied ? "Copied" : "Copy prompt"}
						onClick={promptCopy.copy}
						className="home-aurora__install-copy"
						data-state={promptCopy.copied ? "success" : undefined}
					>
						<Sparkles
							className="home-aurora__install-icon"
							aria-hidden="true"
						/>
						<span className="home-aurora__install-label">Copy prompt</span>
						<span className="home-aurora__install-copy-affordance">
							{promptCopy.copied ? (
								<Check className="size-5 text-[var(--color-success)]" />
							) : (
								<Copy className="size-5" />
							)}
						</span>
					</button>
				</div>
			)}
		</div>
	);
}
