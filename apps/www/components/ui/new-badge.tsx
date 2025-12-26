import { Badge } from "./badge";
import { cn } from "~/lib/utils";

export function NewBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4 text-[10px] px-[0.2rem] font-bold uppercase tracking-wider",
				className,
			)}
		>
			new
		</Badge>
	);
}

export function UpdatedBadge({ className }: { className?: string }) {
	return (
		<Badge
			className={cn(
				"h-4 text-[10px] px-[0.2rem] font-bold uppercase tracking-wider",
				className,
			)}
		>
			updated
		</Badge>
	);
}
