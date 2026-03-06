"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only on the user's first docs session (null while determining).
 * Increments a localStorage counter on each mount.
 */
export function useIsFirstSession(): boolean | null {
	const [firstSession, setFirstSession] = useState<boolean | null>(null);

	useEffect(() => {
		const sessions = Number(localStorage.getItem("arkenv-doc-sessions") ?? 0);
		localStorage.setItem("arkenv-doc-sessions", String(sessions + 1));
		setFirstSession(sessions === 0);
	}, []);

	return firstSession;
}
