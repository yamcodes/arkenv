import { Badge } from "./badge";
import { cn } from "~/lib/utils";

export function NewBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4.5 text-[10px] px-1.5 font-bold rounded-full",
				className,
			)}
		>
			New
		</Badge>
	);
}

export function UpdatedBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4.5 text-[10px] px-1.5 font-bold rounded-full",
				className,
			)}
		>
			Updated
		</Badge>
	);
}
