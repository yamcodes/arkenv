let forceServerDepth = 0;

/**
 * Run build-time schema evaluation with server-side env resolution enabled.
 * Uses a module-scoped depth counter so nested validation calls remain safe.
 */
export function withForceServer<T>(fn: () => T): T {
	forceServerDepth++;
	try {
		return fn();
	} finally {
		forceServerDepth--;
	}
}

/** Whether build-time validation is currently forcing server-side resolution. */
export function isForceServer(): boolean {
	return forceServerDepth > 0;
}
