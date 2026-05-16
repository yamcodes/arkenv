"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCopyCommand } from "~/hooks/use-copy-command";

type CopyButtonProps = {
	command: string;
	copied?: boolean;
	onClick?: () => void;
	asChild?: boolean;
};

export function CopyButton({
	command,
	copied: copiedProp,
	onClick,
	asChild,
}: CopyButtonProps) {
	const { copy, copied: copiedInternal } = useCopyCommand(command);

	const isCopied = copiedProp ?? copiedInternal;
	const handleCopy = onClick ?? copy;

	return (
		<Button
			asChild={asChild}
			variant="ghost"
			size="icon"
			onClick={(e) => {
				e.stopPropagation();
				handleCopy();
			}}
			className="hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
			aria-label={isCopied ? "Copied" : "Copy command"}
		>
			{asChild ? (
				<span>
					{isCopied ? (
						<Check aria-hidden="true" />
					) : (
						<Copy aria-hidden="true" />
					)}
				</span>
			) : isCopied ? (
				<Check aria-hidden="true" />
			) : (
				<Copy aria-hidden="true" />
			)}
		</Button>
	);
}
