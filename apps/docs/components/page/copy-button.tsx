"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

type CopyButtonProps = {
	command: string;
};

export function CopyButton({ command }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleClick = () => {
		navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={handleClick}
			className={clsx(
				copied ? "cursor-default" : "cursor-pointer",
				"bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-300",
			)}
		>
			{copied ? <Check /> : <Copy />}
			<span className="sr-only">Copy command</span>
		</Button>
	);
}
