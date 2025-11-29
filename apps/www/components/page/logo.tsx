import Image from "next/image";
import { cn } from "~/lib/utils";

/**
 * Logo component
 *
 * @param className - Optional className for custom styling
 * @returns Logo component
 */
export function Logo({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Image
				src="/assets/icon.svg"
				alt=""
				aria-hidden="true"
				width={24}
				height={24}
				className="size-6"
			/>
			<span className="text-fd-foreground">ArkEnv</span>
		</div>
	);
}
