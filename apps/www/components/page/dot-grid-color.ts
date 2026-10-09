/**
 * Dot fade shared by the static CSS field and the canvas.
 * `14%` matches `color-mix(... var(--dot-alpha), transparent)`.
 */
export const DEFAULT_DOT_ALPHA = 0.14;

export type DotFill = {
	kind: "faded" | "fallback";
	fill: string;
	globalAlpha: number;
};

/**
 * Alpha of a computed CSS color. Opaque colors return 1.
 * Returns null when the string is not a color we can trust.
 */
export function cssColorAlpha(color: string): number | null {
	const value = color.trim();
	if (!value) return null;
	if (value.toLowerCase() === "transparent") return 0;

	const slash = /\/\s*([0-9.]+%?)\s*\)\s*$/.exec(value);
	if (slash?.[1]) return parseAlphaToken(slash[1]);

	const fn = value.toLowerCase();
	if (fn.startsWith("rgba(") || fn.startsWith("hsla(")) {
		const body = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
		const parts = body
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);
		const alpha = parts.at(-1);
		if (parts.length >= 4 && alpha) return parseAlphaToken(alpha);
	}

	if (
		/^(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color|rgba|hsla)\(/i.test(value) ||
		value.startsWith("#")
	) {
		return 1;
	}

	return null;
}

/**
 * `--dot-alpha` from CSS (`14%` or `0.14`). Anything else falls back to the
 * hero fade so a missing stylesheet cannot paint solid dots.
 */
export function parseDotAlpha(raw: string): number {
	const token = raw.trim();
	if (!token) return DEFAULT_DOT_ALPHA;
	const percent = token.endsWith("%");
	const value = Number.parseFloat(token);
	if (!Number.isFinite(value)) return DEFAULT_DOT_ALPHA;
	const alpha = percent ? value / 100 : value;
	if (alpha <= 0 || alpha >= 1) return DEFAULT_DOT_ALPHA;
	return alpha;
}

/**
 * How the canvas should fill one dot.
 *
 * The route stylesheet can arrive after the first effect on a client
 * navigation. `getComputedStyle(canvas).color` is then the inherited ink
 * (`oklch(95% 0.01 200)`, fully opaque) instead of the 14% mix, and the
 * canvas keeps that paint after the real rule lands. Opaque ink is drawn at
 * `--dot-alpha`. A color that already carries alpha is used as-is.
 */
export function resolveDotFill(
	computedColor: string,
	dotAlpha: number,
): DotFill | null {
	const alpha = cssColorAlpha(computedColor);
	if (alpha == null || alpha <= 0) return null;
	if (alpha < 1) {
		return { kind: "faded", fill: computedColor, globalAlpha: 1 };
	}
	if (!(dotAlpha > 0 && dotAlpha < 1)) return null;
	return { kind: "fallback", fill: computedColor, globalAlpha: dotAlpha };
}

function parseAlphaToken(token: string): number | null {
	const trimmed = token.trim();
	const percent = trimmed.endsWith("%");
	const value = Number.parseFloat(trimmed);
	if (!Number.isFinite(value)) return null;
	return percent ? value / 100 : value;
}
