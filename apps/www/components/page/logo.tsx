import { cn } from "~/lib/utils";
import "./logo.css";

/**
 * Brand mark — helm icon, optional “ArkEnv” wordmark, and optional RC chip.
 * The RC chip is decorative (not its own link); wrap `Logo` in the home link
 * so icon + wordmark + RC are one hit target.
 */
export function Logo({
	className,
	wordmark = true,
	releaseTag,
}: {
	className?: string;
	wordmark?: boolean;
	/**
	 * Channel tag from `RELEASE_TAG` (pass from the server into client trees).
	 * When `"rc"`, shows a non-interactive RC chip next to the wordmark.
	 */
	releaseTag?: string;
}) {
	const showRc = wordmark && releaseTag === "rc";

	return (
		<div className={cn("logo", className)}>
			<svg
				width="28"
				height="28"
				viewBox="0 0 12 12"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				className="logo__icon size-7"
			>
				<path
					className="stroke-cyan-500 dark:stroke-cyan-400"
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
					className="fill-cyan-500 dark:fill-cyan-400"
					style={{
						fillOpacity: 1,
						fillRule: "nonzero",
						stroke: "none",
						strokeWidth: 1,
					}}
					d="M6 5.102a.899.899 0 1 0 0 1.797.899.899 0 0 0 0-1.797Z"
				/>
			</svg>
			{wordmark ? (
				<span className="logo__wordmark">
					<span className="logo__name">ArkEnv</span>
					{showRc ? (
						<span className="logo__rc" aria-hidden="true">
							RC
						</span>
					) : null}
				</span>
			) : null}
		</div>
	);
}
