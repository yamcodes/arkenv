"use client";

import { Terminal } from "lucide-react";
import { useCopyCommand } from "~/hooks/use-copy-command";
import { CopyButton } from "./copy-button";

export function CLICommand() {
	const command = "npx @arkenv/cli@latest init";
	const { copy, copied } = useCopyCommand(command);

	return (
		<button
			type="button"
			onClick={copy}
			className="hidden sm:flex items-center gap-3 pl-4 pr-1.5 h-12 sm:h-10 bg-white/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl backdrop-blur-sm group transition-all duration-300 w-full sm:w-auto shadow-lg shadow-black/5 dark:shadow-black/10 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 text-left"
		>
			<Terminal className="w-4 h-4 text-blue-500 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
			<code className="text-sm font-mono whitespace-nowrap overflow-hidden text-ellipsis">
				<span className="text-blue-600 dark:text-blue-400">npx</span>{" "}
				<span className="text-emerald-600 dark:text-emerald-400">
					@arkenv/cli@latest
				</span>{" "}
				<span className="text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors">
					init
				</span>
			</code>
			<div className="ml-auto border-l border-slate-200 dark:border-slate-700/50 pl-1 flex-shrink-0">
				<CopyButton command={command} copied={copied} onClick={copy} asChild />
			</div>
		</button>
	);
}
