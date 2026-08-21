/**
 * Geist-style three-sparkle mark (not Gemini’s four-point star).
 */
export function SparklesIcon({
	className,
	width = 16,
	height = 16,
}: {
	className?: string;
	width?: number | string;
	height?: number | string;
}) {
	return (
		<svg
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			className={className}
			aria-hidden="true"
			fill="currentColor"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M2.5.5V0h1v.5c0 1.1.9 2 2 2H6v1h-.5a2 2 0 0 0-2 2V6h-1v-.5a2 2 0 0 0-2-2H0v-1h.5a2 2 0 0 0 2-2m12 4V5h-1v-.5a1 1 0 0 0-1-1H12v-1h.5a1 1 0 0 0 1-1V1h1v.5a1 1 0 0 0 1 1h.5v1h-.5a1 1 0 0 0-1 1m-6-.5-.1.93A5 5 0 0 1 3.94 9.4L3 9.5v1l.93.1a5 5 0 0 1 4.48 4.47l.09.93h1l.1-.93a5 5 0 0 1 4.47-4.48l.93-.09v-1l-.93-.1A5 5 0 0 1 9.6 4.94L9.5 4z"
			/>
		</svg>
	);
}
