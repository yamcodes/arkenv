"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
type CopyButtonProps = {
	command: string;
};

export function CopyButton({ command }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const handleClick = () => {
		try {
			navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
			toast({
				description: "Command copied to clipboard!",
				duration: 2000,
			});
		} catch (error) {
			console.error("Failed to copy:", error);
			toast({
				title: "Uh oh! Something went wrong.",
				description:
					"There was a problem copying the command to your clipboard.",
				variant: "destructive",
			});
		}
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={handleClick}
			className="hover:bg-slate-800 text-slate-400 hover:text-slate-100"
			aria-label="Copy command"
		>
			{copied ? <Check /> : <Copy />}
			<span className="sr-only">Copy command</span>
		</Button>
	);
}
