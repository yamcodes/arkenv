import { SiTypescript } from "@icons-pack/react-simple-icons";
import type { ReactNode } from "react";

function isTypeScriptTitle(title: string) {
	return /\.tsx?(?:\s|$)/.test(title) || title.endsWith(".ts");
}

function fileMark(title: string | undefined, icon: ReactNode | undefined) {
	if (icon !== undefined) return icon;
	if (title && isTypeScriptTitle(title)) {
		return <SiTypescript aria-hidden="true" />;
	}
	return null;
}

/**
 * Docs-style codeblock header: language icon, filename, optional actions.
 */
export function WindowChrome({
	title,
	url,
	icon,
	className,
	children,
}: {
	title?: string;
	url?: string;
	icon?: ReactNode;
	className?: string;
	children?: ReactNode;
}) {
	const caption = title ?? url;
	const mark = fileMark(title, icon);
	const tools = children != null;

	return (
		<div
			className={[
				"home-aurora__window-chrome",
				tools ? "home-aurora__window-chrome--tools" : "",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{mark ? (
				<span className="home-aurora__window-icon" aria-hidden="true">
					{mark}
				</span>
			) : null}
			{caption ? (
				<span className="home-aurora__window-title">{caption}</span>
			) : null}
			{children}
		</div>
	);
}
