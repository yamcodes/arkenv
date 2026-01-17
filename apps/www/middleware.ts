import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

const { rewrite: rewriteLLM } = rewritePath(
	"/docs{/*path}",
	"/llms.mdx/docs{/*path}",
);

export default function middleware(request: NextRequest) {
	if (isMarkdownPreferred(request)) {
		const result = rewriteLLM(request.nextUrl.pathname);

		if (result) {
			return NextResponse.rewrite(new URL(result, request.nextUrl));
		}
	}

	return proxy(request);
}

export const config = {
	matcher: ["/docs/:path*"],
};
