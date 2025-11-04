"use client";

import { captureException } from "@sentry/nextjs";
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

	const handleClick = async () => {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast({
				description: "Command copied to clipboard!",
				duration: 2000,
			});
		} catch (error) {
			captureException(error);
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
			aria-label={copied ? "Copied" : "Copy command"}
		>
			{copied ? (
				<Check aria-label="Check icon" />
			) : (
				<Copy aria-label="Copy icon" />
			)}
			<span className="sr-only">Copy command</span>
		</Button>
	);
}
