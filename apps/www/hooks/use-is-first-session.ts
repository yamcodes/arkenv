"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only on the user's first session for a given key (null while determining).
 * Increments a localStorage counter on each mount, scoped to the provided key.
 */
export function useIsFirstSession(key: string): boolean | null {
	const [firstSession, setFirstSession] = useState<boolean | null>(null);

	useEffect(() => {
		const storageKey = `arkenv-doc-sessions:${key}`;
		const sessions = Number(localStorage.getItem(storageKey) ?? 0);
		localStorage.setItem(storageKey, String(sessions + 1));
		setFirstSession(sessions === 0);
	}, [key]);

	return firstSession;
}
