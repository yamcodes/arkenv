"use client";

import { Terminal } from "lucide-react";
import { CopyButton } from "./copy-button";

export function CLICommand() {
	const command = "npx @arkenv/cli@latest init";

	return (
		<div className="hidden sm:flex items-center gap-3 pl-4 pr-1.5 h-12 sm:h-10 bg-white/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl backdrop-blur-sm group transition-all duration-300 w-full sm:w-auto shadow-lg shadow-black/5 dark:shadow-black/10">
			<Terminal className="w-4 h-4 text-blue-500 dark:text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
			<code className="text-sm font-mono text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
				{command}
			</code>
			<div className="ml-auto border-l border-slate-200 dark:border-slate-700/50 pl-1 flex-shrink-0">
				<CopyButton command={command} />
			</div>
		</div>
	);
}
