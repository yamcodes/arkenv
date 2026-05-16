"use client";

import { captureException } from "@sentry/nextjs";
import { useCallback, useState } from "react";
import { useToast } from "~/hooks/use-toast";

export function useCopyCommand(command: string) {
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const copy = useCallback(async () => {
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
	}, [command, toast]);

	return { copy, copied };
}
