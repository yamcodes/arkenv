import { cn } from "~/lib/utils";

/**
 * Logo component
 *
 * @param className - Optional className for custom styling
 * @returns Logo component
 */
export function Logo({ className }: { className?: string }) {
	return (
		<code
			className={cn(
				"font-bold text-fd-foreground relative decoration-[rgb(180,215,255)] decoration-wavy decoration-1 underline underline-offset-4",
				className,
			)}
		>
			ark.env
		</code>
	);
}
