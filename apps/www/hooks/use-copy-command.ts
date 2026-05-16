"use client";

import { captureException } from "@sentry/nextjs";
import { useState } from "react";
import { useToast } from "./use-toast";

/**
 * A hook that provides logic for copying a command to the clipboard
 * and displaying success/error toasts.
 *
 * @param command - The string command to be copied.
 * @returns An object containing the `copied` state and the `copy` function.
 */
export function useCopyCommand(command: string) {
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const copy = async () => {
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

	return { copied, copy };
}
