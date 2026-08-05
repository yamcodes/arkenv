/**
 * Shared faux-window traffic lights + optional title or URL address bar.
 * Used by CLI, IDE mock, before/after compare, and playground frame.
 */
export function WindowChrome({
	title,
	url,
	className,
}: {
	title?: string;
	url?: string;
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
			{url ? (
				<div className="home-aurora__window-url-bar">
					<span className="home-aurora__window-url">{url}</span>
				</div>
			) : title ? (
				<span className="home-aurora__window-title">{title}</span>
			) : null}
		</div>
	);
}
