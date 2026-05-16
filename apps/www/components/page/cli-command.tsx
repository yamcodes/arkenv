"use client";

import { Terminal } from "lucide-react";
import { CopyButton } from "./copy-button";
import { useCopyCommand } from "~/hooks/use-copy-command";

export function CLICommand() {
	const command = "npx @arkenv/cli@latest init";
	const { copied, copy } = useCopyCommand(command);

	return (
		<div
			role="button"
			aria-label="Copy install command"
			tabIndex={0}
			onClick={copy}
			onKeyDown={(e) => e.key === "Enter" && copy()}
			className="cursor-pointer hidden sm:flex items-center gap-3 pl-4 pr-1.5 h-12 sm:h-10 bg-white/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl backdrop-blur-sm group transition-all duration-300 w-full sm:w-auto shadow-lg shadow-black/5 dark:shadow-black/10 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-900/90 active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
		>
			<Terminal className="w-4 h-4 text-blue-500 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
			<code className="text-sm font-mono whitespace-nowrap overflow-hidden text-ellipsis">
				<span className="text-slate-500 dark:text-slate-400">npx </span>
				<span className="text-blue-600 dark:text-blue-400">@arkenv/cli</span>
				<span className="text-slate-500 dark:text-slate-400">@latest </span>
				<span className="text-amber-600 dark:text-amber-400">init</span>
			</code>
			<div className="ml-auto border-l border-slate-200 dark:border-slate-700/50 pl-1 flex-shrink-0">
				<CopyButton command={command} copied={copied} onCopy={copy} />
			</div>
		</div>
	);
}
