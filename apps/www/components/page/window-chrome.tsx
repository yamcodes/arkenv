/**
 * Shared faux-window traffic lights + optional title.
 * Used by CLI, IDE mock, before/after compare, and playground frame.
 */
export function WindowChrome({
	title,
	className,
}: {
	title?: string;
	className?: string;
}) {
	return (
		<div
			className={["home-aurora__window-chrome", className]
				.filter(Boolean)
				.join(" ")}
			aria-hidden="true"
		>
			<span className="home-aurora__window-traffic">
				<span data-tone="close" />
				<span data-tone="min" />
				<span data-tone="max" />
			</span>
			{title ? (
				<span className="home-aurora__window-title">{title}</span>
			) : null}
		</div>
	);
}
