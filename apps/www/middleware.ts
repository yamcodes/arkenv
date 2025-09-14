import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
	const response = NextResponse.next();

	// Add security headers for StackBlitz embed
	response.headers.set(
		"Content-Security-Policy",
		`frame-ancestors 'self' https://stackblitz.com https://*.stackblitz.com`,
	);
	response.headers.set("X-Frame-Options", "ALLOW-FROM https://stackblitz.com");

	return response;
}

export const config = {
	matcher: "/((?!monitoring).*)",
};
