"use client";

import { useRef } from "react";
import { HERO_MVP_VALIDATORS } from "./hero-mvp-snippets";
import { useHeroPlayground } from "./hero-playground";

export const HERO_VALIDATOR_NAMES = HERO_MVP_VALIDATORS.map(
	(item) => item.label,
);
export {
	HERO_CYCLE_MS,
	HERO_FIRST_DWELL_MS,
} from "./hero-playground";

/**
 * Accent-colored H1 name. Reads the shared hero validator so tabs and copy stay in sync.
 */
export function HeroNameCycle() {
	const { validator } = useHeroPlayground();
	const index = Math.max(
		0,
		HERO_MVP_VALIDATORS.findIndex((item) => item.id === validator),
	);
	const currentRef = useRef(index);
	const prevRef = useRef(index);
	if (currentRef.current !== index) {
		prevRef.current = currentRef.current;
		currentRef.current = index;
	}
	const previous = prevRef.current;

	return (
		<span className="home-aurora__cycle">
			<span className="home-aurora__cycle-viewport">
				{HERO_MVP_VALIDATORS.map((item, nameIndex) => {
					if (nameIndex !== index && nameIndex !== previous) return null;
					const pos = nameIndex === index ? "current" : "prev";
					return (
						<span
							key={item.id}
							className="home-aurora__cycle-item"
							data-pos={pos}
							aria-hidden={pos === "current" ? undefined : true}
						>
							{item.label}
						</span>
					);
				})}
			</span>
		</span>
	);
}
