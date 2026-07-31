"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { WindowChrome } from "./window-chrome";

type BeforeAfterCompareViewProps = {
	beforeHtml: string;
	afterHtml: string;
	reduction: number;
};

/**
 * Scroll-driven before/after reveal. Drag still works as a manual override.
 * Full 0–100% travel; pane padding keeps labels readable at the edges.
 */
export function BeforeAfterCompareView({
	beforeHtml,
	afterHtml,
	reduction,
}: BeforeAfterCompareViewProps) {
	const [compare, setCompare] = useState(100);
	const [manual, setManual] = useState(false);
	const compareRef = useRef<HTMLDivElement>(null);
	const labelId = useId();

	useEffect(() => {
		if (manual) return;

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (reduceMotion.matches) {
			setCompare(50);
			return;
		}

		const updateFromScroll = () => {
			const el = compareRef.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const view = window.innerHeight || 1;
			const start = view * 0.85;
			const end = view * 0.2;
			const raw = (start - rect.top) / (start - end);
			const progress = Math.min(1, Math.max(0, raw));
			setCompare(Math.round((1 - progress) * 100));
		};

		updateFromScroll();
		window.addEventListener("scroll", updateFromScroll, { passive: true });
		window.addEventListener("resize", updateFromScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", updateFromScroll);
			window.removeEventListener("resize", updateFromScroll);
		};
	}, [manual]);

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-before-after"
			id="declarative"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					01 - DECLARATIVE
				</p>
				<h2 id="home-before-after" data-reveal="blur">
					<a
						href="https://blog.ramonvullings.com/post/77099512035/simplify-simplify-simplify-message-on-the-wall-of"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span className="home-aurora__pitch-struck">
							<s>Simplify</s>, <s>simplify</s>,
						</span>{" "}
						simplify.
					</a>
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Replace your manual <code>process.env</code> checks with one schema.
					Skip the separate interfaces and error handling.
				</p>
				<p
					className="home-aurora__compare-stat"
					data-reveal
					style={{ ["--reveal-delay" as string]: "140ms" }}
				>
					<span>{reduction}%</span> less code, same checks
				</p>
			</header>

			<div
				className="home-aurora__compare-window"
				data-reveal
				style={{ ["--reveal-delay" as string]: "180ms" }}
			>
				<WindowChrome title="env.ts" />
				<div
					ref={compareRef}
					className="home-aurora__compare"
					style={{ "--compare": `${compare}%` } as CSSProperties}
					data-manual={manual ? "true" : undefined}
				>
					{/* Invisible sizer so the frame fits the full old-way snippet */}
					<div
						className="home-aurora__compare-sizer"
						aria-hidden="true"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
						dangerouslySetInnerHTML={{ __html: beforeHtml }}
					/>
					<input
						type="range"
						min={0}
						max={100}
						value={compare}
						aria-labelledby={labelId}
						aria-valuetext={`${compare}% ArkEnv way revealed`}
						className="home-aurora__compare-range"
						onPointerDown={() => setManual(true)}
						onInput={(event) => {
							setManual(true);
							setCompare(Number((event.target as HTMLInputElement).value));
						}}
					/>
					<p id={labelId} className="sr-only">
						Reveal ArkEnv versus the old way
					</p>

					<div
						className="home-aurora__compare-pane home-aurora__compare-pane--after"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
						dangerouslySetInnerHTML={{ __html: afterHtml }}
					/>
					<div
						className="home-aurora__compare-pane home-aurora__compare-pane--before"
						aria-hidden="true"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
						dangerouslySetInnerHTML={{ __html: beforeHtml }}
					/>
					<div className="home-aurora__compare-handle" aria-hidden="true">
						<span className="home-aurora__compare-grip" />
					</div>
				</div>
			</div>
		</section>
	);
}
