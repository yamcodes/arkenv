import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { source } from "~/lib/source";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Only handle /docs paths (but not /docs/arkenv/* which should work normally)
	if (!pathname.startsWith("/docs")) {
		return NextResponse.next();
	}

	// Skip if already under /docs/arkenv
	if (pathname.startsWith("/docs/arkenv")) {
		return NextResponse.next();
	}

	// Skip the root /docs redirect (handled by next.config.ts)
	if (pathname === "/docs") {
		return NextResponse.next();
	}

	// Extract the slug from the path
	// e.g., /docs/quickstart -> ["quickstart"]
	// e.g., /docs/how-to/load -> ["how-to", "load"]
	const slug = pathname.replace("/docs", "").split("/").filter(Boolean);

	// Check if the page exists with the original slug
	const page = source.getPage(slug);
	if (page) {
		// Page exists, let it render normally
		return NextResponse.next();
	}

	// Page doesn't exist, try with "arkenv" prefix
	const arkenvSlug = ["arkenv", ...slug];
	const arkenvPage = source.getPage(arkenvSlug);
	if (arkenvPage) {
		// Found it under arkenv, redirect there
		const newUrl = request.nextUrl.clone();
		newUrl.pathname = `/docs/arkenv/${slug.join("/")}`;
		return NextResponse.redirect(newUrl);
	}

	// Not found even under arkenv, let it fall through to 404
	return NextResponse.next();
}

export const config = {
	matcher: "/docs/:path*",
};
