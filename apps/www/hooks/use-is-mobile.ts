import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized.
 *
 * Based on the implementation from Vercel AI Chatbot:
 * @see https://github.com/vercel/ai-chatbot/blob/main/hooks/use-mobile.tsx
 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		undefined,
	);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
