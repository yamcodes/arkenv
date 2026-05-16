"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCopyCommand } from "~/hooks/use-copy-command";

type CopyButtonProps = {
	command: string;
	copied?: boolean;
	onCopy?: () => void;
};

export function CopyButton({
	command,
	copied: externalCopied,
	onCopy,
}: CopyButtonProps) {
	const internal = useCopyCommand(command);
	const copied = externalCopied ?? internal.copied;
	const copy = onCopy ?? internal.copy;

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={(e) => {
				e.stopPropagation();
				copy();
			}}
			className="hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
			aria-label={copied ? "Copied" : "Copy command"}
		>
			{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
		</Button>
	);
}
