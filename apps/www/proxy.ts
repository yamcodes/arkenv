import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { source } from "~/lib/source";

const { rewrite: rewriteLLM } = rewritePath(
	"/docs{/*path}",
	"/llms.mdx/docs{/*path}",
);

export function proxy(request: NextRequest) {
	if (isMarkdownPreferred(request)) {
		const result = rewriteLLM(request.nextUrl.pathname);

		if (result) {
			return NextResponse.rewrite(new URL(result, request.nextUrl));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/docs/:path*", "/docs"],
};
