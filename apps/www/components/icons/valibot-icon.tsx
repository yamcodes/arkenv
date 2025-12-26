/**
 * Valibot logo icon component.
 *
 * @param props.className - Additional CSS classes.
 * @param props.width - Width of the icon (default: 20).
 * @param props.height - Height of the icon (default: 20).
 */
export function ValibotIcon({
	className,
	width = 20,
	height = 20,
}: {
	className?: string;
	width?: number | string;
	height?: number | string;
}) {
	return (
		<svg
			viewBox="0 0 48 48"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			height={height}
			width={width}
			className={className}
			aria-hidden="true"
		>
			<defs>
				<mask id="valibot-mask">
					<rect width="48" height="48" fill="white" />
					{/* Mouth/Screen area - cut out */}
					<path
						d="M15.73 9.63h19.98a8.4 8.4 0 0 1 8.65 8.14l.54 11.84c.06 5.88-4.23 8.28-9.19 8.32l-19.98.25c-5.14.04-8.24-3.81-8.14-8.57l.34-11.84c.31-5.21 2.59-8.04 7.8-8.14Z"
						fill="black"
					/>
					{/* Eyes - keep solid in the mask area? 
					    Actually, if we want the eyes to be "solid" currentColor against the background, 
					    we should exclude them from the hole. */}
					<path
						d="M2.59 0A2.59 2.59 0 1 1 0 2.59 2.59 2.59 0 0 1 2.59 0Z"
						transform="translate(34.23 19.25)"
						fill="white"
					/>
					<path
						d="M2.59 0A2.59 2.59 0 1 1 0 2.59 2.59 2.59 0 0 1 2.59 0Z"
						transform="translate(14.25 19.25)"
						fill="white"
					/>
				</mask>
			</defs>
			<g fill="currentColor" mask="url(#valibot-mask)">
				<path
					d="M629.38 987.02c-6.26 0-11.17 5.13-11.43 11.86l-.24 8.95c-.37 7.37 6.75 9.89 11.9 9.89Z"
					transform="translate(-615.34 -978.37)"
				/>
				<path
					d="M8.68 0h21.3a9 9 0 0 1 9.23 8.75l.58 12.73c.07 6.31-4.51 8.9-9.8 8.94l-21.31.27c-5.49.04-8.78-4.1-8.68-9.21L.35 8.75C.7 3.15 3.13.1 8.69 0Z"
					transform="translate(5.85 8.65)"
				/>
			</g>
		</svg>
	);
}
