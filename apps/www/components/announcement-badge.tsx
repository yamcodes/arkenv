import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewBadge } from "./ui/new-badge";

export function AnnouncementBadge() {
	return (
		<Link
			href="/docs/arkenv/coercion"
			className="group relative flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-sm font-medium text-blue-900 transition-all hover:bg-blue-500/10 dark:text-blue-200 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-blue-500/30"
		>
			<NewBadge className="h-5" />
			<span className="flex items-center gap-1">
				Type coercion support
				<ArrowUpRight className="h-3.5 w-3.5 text-blue-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			</span>

			{/* Decorative background glow on hover */}
			<div className="absolute inset-0 -z-10 rounded-full bg-blue-400/0 blur-xl transition-all group-hover:bg-blue-400/10" />
		</Link>
	);
}
