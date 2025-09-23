import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const response = NextResponse.next();

	// Add security headers for StackBlitz embed and TypeScript Playground
	const isPlayground = request.nextUrl.pathname === "/playground";

	if (isPlayground) {
		// More permissive CSP for playground route
		response.headers.set(
			"Content-Security-Policy",
			`frame-ancestors 'self' https://stackblitz.com https://*.stackblitz.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.typescriptlang.org https://playgroundcdn.typescriptlang.org; connect-src 'self' https://www.typescriptlang.org https://playgroundcdn.typescriptlang.org; style-src 'self' 'unsafe-inline' https://www.typescriptlang.org https://playgroundcdn.typescriptlang.org`,
		);
	} else {
		// Standard CSP for other routes
		response.headers.set(
			"Content-Security-Policy",
			`frame-ancestors 'self' https://stackblitz.com https://*.stackblitz.com`,
		);
	}

	response.headers.set("X-Frame-Options", "ALLOW-FROM https://stackblitz.com");

	return response;
}

export const config = {
	matcher: "/((?!monitoring).*)",
};
