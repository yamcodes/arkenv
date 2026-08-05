import { cn } from "~/lib/utils";
import { Badge } from "./badge";

export function NewBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4.5 text-xs px-1.5 font-medium rounded-full sm:px-1.5 max-sm:w-2 max-sm:h-2 max-sm:p-0 max-sm:ml-1.5 max-sm:bg-current max-sm:border-none",
				className,
			)}
		>
			<span className="hidden sm:inline">New</span>
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
