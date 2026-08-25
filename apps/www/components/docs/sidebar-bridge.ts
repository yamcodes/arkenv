/**
 * Site Nav sits outside DocsLayout (so sticky chrome isn't a grid item),
 * but the drawer state lives in DocsSidebarProvider. This module is the
 * seam: the visible trigger SSRs in the nav; the provider registers here.
 */

type SidebarApi = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

const listeners = new Set<() => void>();

let api: SidebarApi = {
	open: false,
	setOpen: () => {},
};

function emit(): void {
	for (const listener of listeners) listener();
}

export function registerDocsSidebar(next: SidebarApi): () => void {
	api = next;
	emit();
	return () => {
		if (api === next) {
			api = { open: false, setOpen: () => {} };
			emit();
		}
	};
}

export function subscribeDocsSidebar(onStoreChange: () => void): () => void {
	listeners.add(onStoreChange);
	return () => {
		listeners.delete(onStoreChange);
	};
}

export function getDocsSidebarOpen(): boolean {
	return api.open;
}

export function toggleDocsSidebar(): void {
	api.setOpen(!api.open);
}
