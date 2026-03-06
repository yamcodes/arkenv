"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

type Option = {
	value: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
};

// Persists across remounts so navigation never resets the mounted/theme state.
let hydrated = false;
let cachedTheme: string | undefined;

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(hydrated);

	// Keep the cache up to date whenever the theme resolves.
	useEffect(() => {
		if (theme !== undefined) cachedTheme = theme;
	}, [theme]);

	useEffect(() => {
		hydrated = true;
		setMounted(true);
	}, []);

	const options = [
		{ value: "light", icon: Sun, label: "Light" },
		{ value: "system", icon: Monitor, label: "System" },
		{ value: "dark", icon: Moon, label: "Dark" },
	] as const satisfies Option[];

	// Use the cached theme when the theme is transiently undefined (e.g., right after a remount).
	const effectiveTheme = theme ?? cachedTheme;

	return (
		<TooltipProvider>
			<fieldset
				className={cn(
					"theme-toggle inline-flex h-9 items-center rounded-full border bg-fd-background p-1",
					className,
				)}
				aria-label="Toggle Theme"
			>
				{options.map((option) => {
					const Icon = option.icon;
					const isActive = mounted && effectiveTheme === option.value;
					return (
						<Tooltip key={option.value}>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => setTheme(option.value)}
									className={cn(
										"flex h-7 w-7 items-center justify-center rounded-full transition-colors",
										isActive
											? "bg-fd-accent text-fd-accent-foreground"
											: "text-fd-muted-foreground hover:bg-fd-accent/40 hover:text-fd-accent-foreground",
									)}
									aria-pressed={isActive}
									aria-label={option.label}
								>
									<Icon className="h-4 w-4" />
								</button>
							</TooltipTrigger>
							<TooltipContent>{option.label}</TooltipContent>
						</Tooltip>
					);
				})}
			</fieldset>
		</TooltipProvider>
	);
}
