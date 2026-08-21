"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import type { HeroMvpValidatorId } from "./hero-mvp-snippets";

type HeroPlaygroundValue = {
	validator: HeroMvpValidatorId;
	setValidator: (id: HeroMvpValidatorId) => void;
};

const HeroPlaygroundContext = createContext<HeroPlaygroundValue | null>(null);

/**
 * Shared example validator: slogan `env` hover and example tabs.
 * Independent of the H1 name cycle.
 */
export function HeroPlaygroundProvider({ children }: { children: ReactNode }) {
	const [validator, setValidator] = useState<HeroMvpValidatorId>("arktype");

	const value = useMemo(() => ({ validator, setValidator }), [validator]);

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
