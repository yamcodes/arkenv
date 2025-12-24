"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils/cn";

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="flex items-center gap-1 rounded-full border border-fd-border p-1 bg-fd-muted/50 h-9 w-27" />
		);
	}

	const themes = [
		{ name: "light", icon: Sun },
		{ name: "dark", icon: Moon },
		{ name: "system", icon: Monitor },
	] as const;

	return (
		<div className="flex items-center gap-1 rounded-full border border-fd-border p-1 bg-fd-muted/50 w-27">
			{themes.map(({ name, icon: Icon }) => (
				<Button
					key={name}
					variant="ghost"
					size="icon"
					onClick={() => setTheme(name)}
					className={cn(
						"h-7 w-7 rounded-full transition-all",
						theme === name
							? "bg-fd-background text-fd-foreground shadow-sm"
							: "text-fd-muted-foreground hover:text-fd-foreground",
					)}
					aria-label={`Switch to ${name} theme`}
				>
					<Icon className="h-4 w-4" />
				</Button>
			))}
		</div>
	);
}
