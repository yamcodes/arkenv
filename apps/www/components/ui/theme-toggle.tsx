"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

type Option = {
	value: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
};

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className={cn("h-9 w-26 rounded-full border", className)} />;
	}

	const options = [
		{ value: "light", icon: Sun, label: "Light" },
		{ value: "system", icon: Monitor, label: "System" },
		{ value: "dark", icon: Moon, label: "Dark" },
	] as const satisfies Option[];

	return (
		<fieldset
			className={cn(
				"inline-flex h-9 items-center rounded-full border bg-fd-background p-1",
				className,
			)}
			aria-label="Toggle Theme"
		>
			{options.map((option) => {
				const Icon = option.icon;
				const isActive =
					(theme === "system" ? "system" : theme) === option.value;
				return (
					<button
						key={option.value}
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
				);
			})}
		</fieldset>
	);
}
