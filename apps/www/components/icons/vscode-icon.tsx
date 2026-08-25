/**
 * VS Code logo icon (simple-icons removed Microsoft marks; path matches the classic ribbon).
 *
 * @param props.className - Additional CSS classes.
 * @param props.width - Width of the icon (default: 20).
 * @param props.height - Height of the icon (default: 20).
 */
export function VsCodeIcon({
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
			width={width}
			height={height}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="presentation"
		>
			<path
				fill="currentColor"
				d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
			/>
		</svg>
	);
}
