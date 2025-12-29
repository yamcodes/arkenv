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
			<svg
				width="24"
				height="24"
				viewBox="0 0 12 12"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				className="size-6"
			>
				<path
					className="stroke-blue-500 dark:stroke-blue-400"
					style={{
						fill: "none",
						strokeWidth: 0.99975,
						strokeLinecap: "round",
						strokeLinejoin: "round",
						strokeMiterlimit: 10,
						strokeDasharray: "none",
						strokeOpacity: 1,
					}}
					d="M8.5 6c0-1.379-1.121-2.5-2.5-2.5A2.502 2.502 0 0 0 3.5 6c0 1.379 1.121 2.5 2.5 2.5S8.5 7.379 8.5 6ZM6 11V8.5M1 6h2.5m5 0H11M6 3.5V1M2.464 2.464l1.768 1.768m3.536 3.536 1.768 1.768m-7.072 0 1.768-1.768m3.536-3.536 1.768-1.768"
				/>
				<path
					className="fill-blue-500 dark:fill-blue-400"
					style={{
						fillOpacity: 1,
						fillRule: "nonzero",
						stroke: "none",
						strokeWidth: 1,
					}}
					d="M6 5.102a.899.899 0 1 0 0 1.797.899.899 0 0 0 0-1.797Z"
				/>
			</svg>
			<span className="text-fd-foreground font-medium text-sm">ArkEnv</span>
		</div>
	);
}
