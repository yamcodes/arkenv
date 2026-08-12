"use client";

import { type CSSProperties, useEffect, useRef } from "react";

/** Physics tuned for a quiet Aurora field at `DEFAULT_SPACING`. */
const DEFAULT_SPACING = 24;
const DEFAULT_RADIUS = 1;
const INFLUENCE = 110;
const STIFFNESS = 130;
const DAMPING = 9;
const PUSH = 1100;
const DRAG = 1.6;
const MAX_OFFSET = 14;
const MAX_POINTER_SPEED = 2600;
const REST_THRESHOLD = 0.01;

/**
 * Interactive faded-dot atmosphere for the home hero and docs CTAs.
 * Static CSS dots paint first; the canvas takes over after hydration.
 * Spatial push (influence, force, drag, max travel) scales with `spacing`
 * so a denser/zoomed grid keeps the same feel as the hero field.
 */
export function DotGrid({
	spacing = DEFAULT_SPACING,
	radius = DEFAULT_RADIUS,
}: {
	/** Dot grid pitch in CSS pixels. Smaller = denser / more zoomed-out. */
	spacing?: number;
	/** Dot radius in CSS pixels. */
	radius?: number;
} = {}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const scale = spacing / DEFAULT_SPACING;
		const influence = INFLUENCE * scale;
		const influenceSq = influence * influence;
		const push = PUSH * scale;
		const drag = DRAG * scale;
		const maxOffset = MAX_OFFSET * scale;
		const maxOffsetSq = maxOffset * maxOffset;

		let width = 0;
		let height = 0;
		let cols = 0;
		let rows = 0;
		// ox, oy, vx, vy per dot
		let dots = new Float32Array(0);
		let color = "";
		let raf = 0;
		let running = false;
		let lastTime = 0;
		const pointer = {
			x: 0,
			y: 0,
			prevX: 0,
			prevY: 0,
			vx: 0,
			vy: 0,
			active: false,
		};

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		const resolveColor = () => {
			color = getComputedStyle(canvas).color;
		};

		const draw = () => {
			ctx.clearRect(0, 0, width, height);
			ctx.fillStyle = color;
			ctx.beginPath();
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const idx = (row * cols + col) * 4;
					const x = spacing / 2 + col * spacing + dots[idx];
					const y = spacing / 2 + row * spacing + dots[idx + 1];
					ctx.moveTo(x + radius, y);
					ctx.arc(x, y, radius, 0, Math.PI * 2);
				}
			}
			ctx.fill();
		};

		const step = (dt: number) => {
			let moving = false;
			for (let row = 0; row < rows; row++) {
				const baseY = spacing / 2 + row * spacing;
				for (let col = 0; col < cols; col++) {
					const idx = (row * cols + col) * 4;
					const baseX = spacing / 2 + col * spacing;
					let ox = dots[idx];
					let oy = dots[idx + 1];
					let vx = dots[idx + 2];
					let vy = dots[idx + 3];

					let ax = -STIFFNESS * ox - DAMPING * vx;
					let ay = -STIFFNESS * oy - DAMPING * vy;

					if (pointer.active) {
						const dx = baseX + ox - pointer.x;
						const dy = baseY + oy - pointer.y;
						const distSq = dx * dx + dy * dy;
						if (distSq < influenceSq) {
							const dist = Math.sqrt(distSq) || 1;
							const falloff = 1 - dist / influence;
							ax += ((dx / dist) * push + pointer.vx * drag) * falloff;
							ay += ((dy / dist) * push + pointer.vy * drag) * falloff;
						}
					}

					vx += ax * dt;
					vy += ay * dt;
					ox += vx * dt;
					oy += vy * dt;

					const offsetSq = ox * ox + oy * oy;
					if (offsetSq > maxOffsetSq) {
						const clamp = maxOffset / Math.sqrt(offsetSq);
						ox *= clamp;
						oy *= clamp;
					}

					if (offsetSq > REST_THRESHOLD || vx * vx + vy * vy > REST_THRESHOLD) {
						moving = true;
					} else {
						ox = 0;
						oy = 0;
						vx = 0;
						vy = 0;
					}

					dots[idx] = ox;
					dots[idx + 1] = oy;
					dots[idx + 2] = vx;
					dots[idx + 3] = vy;
				}
			}
			return moving;
		};

		const frame = (time: number) => {
			const dt = Math.min(Math.max((time - lastTime) / 1000, 0.001), 1 / 30);
			lastTime = time;

			if (pointer.active) {
				const clamp = (v: number) =>
					Math.max(-MAX_POINTER_SPEED, Math.min(MAX_POINTER_SPEED, v));
				pointer.vx = clamp((pointer.x - pointer.prevX) / dt);
				pointer.vy = clamp((pointer.y - pointer.prevY) / dt);
				pointer.prevX = pointer.x;
				pointer.prevY = pointer.y;
			}

			const moving = step(dt);
			draw();

			if (moving || pointer.active) {
				raf = requestAnimationFrame(frame);
			} else {
				running = false;
			}
		};

		const wake = () => {
			if (running || reduceMotion.matches) return;
			running = true;
			lastTime = performance.now();
			raf = requestAnimationFrame(frame);
		};

		const sleep = () => {
			cancelAnimationFrame(raf);
			running = false;
		};

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			cols = Math.ceil(width / spacing);
			rows = Math.ceil(height / spacing);
			dots = new Float32Array(cols * rows * 4);
			draw();
		};

		const deactivatePointer = () => {
			pointer.active = false;
			pointer.vx = 0;
			pointer.vy = 0;
		};

		const onPointerMove = (event: PointerEvent) => {
			if (reduceMotion.matches) return;
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const inRange =
				x > -influence &&
				y > -influence &&
				x < rect.width + influence &&
				y < rect.height + influence;
			if (!inRange) {
				deactivatePointer();
				return;
			}
			if (!pointer.active) {
				pointer.prevX = x;
				pointer.prevY = y;
			}
			pointer.active = true;
			pointer.x = x;
			pointer.y = y;
			wake();
		};

		const onPointerEnd = (event: PointerEvent) => {
			if (event.pointerType !== "mouse") deactivatePointer();
		};

		const onWindowOut = (event: PointerEvent) => {
			if (!event.relatedTarget) deactivatePointer();
		};

		resolveColor();
		resize();
		canvas.style.backgroundImage = "none";

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);

		const themeObserver = new MutationObserver(() => {
			resolveColor();
			draw();
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "data-theme", "style"],
		});

		const onMotionPreferenceChange = () => {
			if (!reduceMotion.matches) return;
			sleep();
			deactivatePointer();
			dots.fill(0);
			draw();
		};

		window.addEventListener("pointermove", onPointerMove, { passive: true });
		window.addEventListener("pointerup", onPointerEnd, { passive: true });
		window.addEventListener("pointercancel", onPointerEnd, { passive: true });
		window.addEventListener("pointerout", onWindowOut, { passive: true });
		window.addEventListener("blur", deactivatePointer);
		window.addEventListener("scroll", deactivatePointer, { passive: true });
		reduceMotion.addEventListener("change", onMotionPreferenceChange);

		return () => {
			sleep();
			resizeObserver.disconnect();
			themeObserver.disconnect();
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerEnd);
			window.removeEventListener("pointercancel", onPointerEnd);
			window.removeEventListener("pointerout", onWindowOut);
			window.removeEventListener("blur", deactivatePointer);
			window.removeEventListener("scroll", deactivatePointer);
			reduceMotion.removeEventListener("change", onMotionPreferenceChange);
		};
	}, [radius, spacing]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className="home-aurora__dot-grid"
			style={
				{
					["--dot-spacing"]: `${spacing}px`,
				} as CSSProperties
			}
		/>
	);
}
