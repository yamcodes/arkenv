import { cn } from "~/lib/utils";
import { Badge } from "./badge";

export function NewBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn("h-4.5 text-xs px-1.5 font-medium rounded-full", className)}
		>
			New
		</Badge>
	);
}

export function UpdatedBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4.5 text-xs px-1.5 font-semibold rounded-full",
				className,
			)}
		>
			Updated
		</Badge>
	);
}
