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
	const panelId = `${baseId}-panel`;
	const commandTabId = `${baseId}-tab-command`;
	const promptTabId = `${baseId}-tab-prompt`;

	const commandCopy = useCopyCommand(INSTALL_COMMAND, {
		successDescription: "Command copied to clipboard!",
	});
	const promptCopy = useCopyCommand(INSTALL_PROMPT, {
		successDescription: "Prompt copied to clipboard!",
	});

	const active = tab === "command" ? commandCopy : promptCopy;
	const ariaLabel =
		tab === "command"
			? active.copied
				? "Copied"
				: "Copy install command"
			: active.copied
				? "Copied"
				: "Copy prompt";

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
					aria-controls={panelId}
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
					aria-controls={panelId}
					tabIndex={tab === "prompt" ? 0 : -1}
					className="home-aurora__install-tab"
					data-active={tab === "prompt" ? "true" : undefined}
					onClick={() => setTab("prompt")}
				>
					<span aria-hidden="true">✨</span> Prompt
				</button>
			</div>

			<div
				role="tabpanel"
				id={panelId}
				aria-labelledby={tab === "command" ? commandTabId : promptTabId}
			>
				<button
					type="button"
					aria-label={ariaLabel}
					onClick={active.copy}
					className="home-aurora__install-copy"
					data-state={active.copied ? "success" : undefined}
					data-tab={tab}
				>
					<span className="home-aurora__install-swap">
						<span
							className="home-aurora__install-swap-item"
							data-active={tab === "command" ? "true" : undefined}
							aria-hidden={tab !== "command"}
						>
							<Terminal
								className="home-aurora__install-icon"
								aria-hidden="true"
							/>
							<code className="home-aurora__install-code">
								<span className="home-aurora__install-prompt-token">npx </span>
								<span>arkenv@latest init</span>
							</code>
						</span>
						<span
							className="home-aurora__install-swap-item"
							data-active={tab === "prompt" ? "true" : undefined}
							aria-hidden={tab !== "prompt"}
						>
							<Sparkles
								className="home-aurora__install-icon"
								aria-hidden="true"
							/>
							<span className="home-aurora__install-label">Copy prompt</span>
						</span>
					</span>
					<span
						className="home-aurora__install-copy-affordance"
						aria-hidden="true"
					>
						{active.copied ? (
							<Check className="size-5 text-[var(--color-success)]" />
						) : (
							<Copy className="size-5" />
						)}
					</span>
				</button>
			</div>
		</div>
	);
}
