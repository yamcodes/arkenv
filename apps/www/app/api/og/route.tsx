import { generateOGImage } from "fumadocs-ui/og";
import type { NextRequest } from "next/server";
import { formatOgDescription, formatOgTitle } from "~/lib/og-text";

export const runtime = "edge";

export function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const title = formatOgTitle(searchParams.get("title") || "ArkEnv");
	const description = formatOgDescription(
		searchParams.get("description") ||
			"Environment variable validation from editor to runtime",
	);

	return generateOGImage({
		title,
		description,
		site: "ArkEnv Docs",
		primaryColor: "rgba(59, 130, 246, 0.3)",
		primaryTextColor: "rgb(59, 130, 246)",
		icon: (
			<svg
				width="64"
				height="64"
				viewBox="0 0 12 12"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					stroke="#3b82f6"
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
					fill="#3b82f6"
					style={{
						fillOpacity: 1,
						fillRule: "nonzero",
						stroke: "none",
						strokeWidth: 1,
					}}
					d="M6 5.102a.899.899 0 1 0 0 1.797.899.899 0 0 0 0-1.797Z"
				/>
			</svg>
		),
	});
}
