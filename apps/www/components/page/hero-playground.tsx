"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	HERO_MVP_VALIDATORS,
	type HeroMvpValidatorId,
} from "./hero-mvp-snippets";

export const HERO_FIRST_DWELL_MS = 3000;
export const HERO_CYCLE_MS = 2500;

type HeroPlaygroundValue = {
	validator: HeroMvpValidatorId;
	setValidator: (id: HeroMvpValidatorId) => void;
	pause: () => void;
};

const HeroPlaygroundContext = createContext<HeroPlaygroundValue | null>(null);

function prefersReducedMotion() {
	return (
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

function nextValidator(current: HeroMvpValidatorId): HeroMvpValidatorId {
	const index = HERO_MVP_VALIDATORS.findIndex((item) => item.id === current);
	const next = HERO_MVP_VALIDATORS[(index + 1) % HERO_MVP_VALIDATORS.length];
	return next?.id ?? "arktype";
}

/**
 * Shared hero validator: H1, slogan `env` hover, and example tabs.
 * Auto-rotation stops permanently once the user enters the example.
 */
export function HeroPlaygroundProvider({ children }: { children: ReactNode }) {
	const [validator, setValidatorState] =
		useState<HeroMvpValidatorId>("arktype");
	const [paused, setPaused] = useState(false);
	const [reduceMotion, setReduceMotion] = useState(false);

	const pause = useCallback(() => {
		setPaused(true);
	}, []);

	const setValidator = useCallback((id: HeroMvpValidatorId) => {
		setValidatorState(id);
		setPaused(true);
	}, []);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => {
			const reduce = mq.matches;
			setReduceMotion(reduce);
			if (reduce) {
				setValidatorState("arktype");
				setPaused(true);
			}
		};
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	useEffect(() => {
		if (paused || reduceMotion) return;

		const tick = () => {
			if (document.hidden || prefersReducedMotion()) return;
			setValidatorState(nextValidator);
		};

		let intervalId: number | undefined;
		const timeoutId = window.setTimeout(() => {
			tick();
			intervalId = window.setInterval(tick, HERO_CYCLE_MS);
		}, HERO_FIRST_DWELL_MS);

		return () => {
			window.clearTimeout(timeoutId);
			if (intervalId !== undefined) window.clearInterval(intervalId);
		};
	}, [paused, reduceMotion]);

	const value = useMemo(
		() => ({ validator, setValidator, pause }),
		[validator, setValidator, pause],
	);

	return (
		<HeroPlaygroundContext.Provider value={value}>
			{children}
		</HeroPlaygroundContext.Provider>
	);
}

export function useHeroPlayground() {
	const context = useContext(HeroPlaygroundContext);
	if (!context) {
		throw new Error(
			"useHeroPlayground must be used within HeroPlaygroundProvider",
		);
	}
	return context;
}
