"use client";

import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";
import { useCopyCommand } from "~/hooks/use-copy-command";

const INSTALL_COMMAND = "npx arkenv@latest init";

const INSTALL_PROMPT =
	"Set up ArkEnv with `npx arkenv@latest init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.";

type InstallAudience = "humans" | "agents";

export function InstallPanel() {
	const [audience, setAudience] = useState<InstallAudience>("humans");
	const baseId = useId();
	const commandCopy = useCopyCommand(INSTALL_COMMAND, {
		successDescription: "Command copied to clipboard!",
	});
	const promptCopy = useCopyCommand(INSTALL_PROMPT, {
		successDescription: "Prompt copied to clipboard!",
	});
	const active = audience === "humans" ? commandCopy : promptCopy;
	const copyLabel = audience === "humans" ? "Copy install command" : "Copy prompt";

	return (
		<div className="home-aurora__install">
			<div
				className="home-aurora__install-tabs"
				role="tablist"
				aria-label="Install for"
			>
				<button
					type="button"
					role="tab"
					id={`${baseId}-humans`}
					aria-selected={audience === "humans"}
					tabIndex={audience === "humans" ? 0 : -1}
					className="home-aurora__install-tab"
					data-active={audience === "humans" ? "true" : undefined}
					onClick={() => setAudience("humans")}
				>
					For humans
				</button>
				<button
					type="button"
					role="tab"
					id={`${baseId}-agents`}
					aria-selected={audience === "agents"}
					tabIndex={audience === "agents" ? 0 : -1}
					className="home-aurora__install-tab"
					data-active={audience === "agents" ? "true" : undefined}
					onClick={() => setAudience("agents")}
				>
					For agents
				</button>
			</div>
			<button
				type="button"
				aria-label={active.copied ? "Copied" : copyLabel}
				onClick={active.copy}
				className="home-aurora__install-copy"
				data-state={active.copied ? "success" : undefined}
			>
				{audience === "humans" ? (
					<>
						<span
							className="home-aurora__install-prompt-symbol"
							aria-hidden="true"
						>
							$
						</span>
						<code className="home-aurora__install-code">
							npx arkenv@latest init
						</code>
					</>
				) : (
					<span className="home-aurora__install-copy-label">Copy prompt</span>
				)}
				<span
					className="home-aurora__install-copy-affordance"
					aria-hidden="true"
				>
					{active.copied ? (
						<Check className="size-4 text-[var(--color-success)]" />
					) : (
						<Copy className="size-4" />
					)}
				</span>
			</button>
		</div>
	);
}
