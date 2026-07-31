import localFont from "next/font/local";

/**
 * Sentient (Fontshare) — Aurora wordmark outlier.
 * Self-hosted so the header brand mark doesn't depend on a third-party CSS CDN.
 */
export const sentient = localFont({
	src: "./Sentient-Variable.woff2",
	variable: "--font-sentient",
	weight: "200 700",
	display: "swap",
	fallback: ["ui-serif", "Georgia", "serif"],
});
