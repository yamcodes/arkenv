/**
 * ArkType logo icon component.
 *
 * @param props.className - Additional CSS classes.
 * @param props.variant - Visual variant of the icon: "color" (default) or "monotone".
 * @param props.width - Width of the icon (default: 20).
 * @param props.height - Height of the icon (default: 20).
 */
export function ArkTypeIcon({
	className,
	variant = "color",
	width = 20,
	height = 20,
}: {
	className?: string;
	variant?: "color" | "monotone";
	width?: number | string;
	height?: number | string;
}) {
	return (
		<svg
			viewBox="0 0 100 100"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			height={height}
			width={width}
			className={className}
			aria-hidden="true"
		>
			{variant === "color" ? (
				<rect fill="#085b92" width="100" height="100" rx="10" />
			) : (
				<rect
					fill="currentColor"
					fillOpacity="0.1"
					stroke="currentColor"
					strokeWidth="4"
					width="96"
					height="96"
					x="2"
					y="2"
					rx="10"
				/>
			)}
			<g fill={variant === "color" ? "#f5cf8f" : "currentColor"}>
				<path d="M 53.315857,82.644683 H 39.977324 L 36.75999,93.838326 H 28.582598 L 42.85952,46.918864 h 7.507114 l 14.343949,46.919462 h -8.177392 z m -2.14489,-7.507114 -4.55789,-15.885589 -4.490863,15.885589 z" />
				<path d="M 73.35719,54.425978 H 62.096519 v -7.507114 h 30.698733 v 7.507114 H 81.534582 V 93.838326 H 73.35719 Z" />
			</g>
		</svg>
	);
}
