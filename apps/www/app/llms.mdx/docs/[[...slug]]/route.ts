import { notFound } from "next/navigation";
import { getLLMText } from "~/lib/get-llm-text";
import { source } from "~/lib/source";

export const revalidate = false;

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ slug?: string[] }> },
) {
	const { slug } = await params;
	const normalizedSlug = slug?.map((s, i) =>
		i === slug.length - 1 ? s.replace(/\.(md|mdx)$/, "") : s,
	);
	const page = source.getPage(normalizedSlug);
	if (!page) notFound();

	return new Response(await getLLMText(page), {
		headers: {
			"Content-Type": "text/markdown",
		},
	});
}

export function generateStaticParams() {
	return source.generateParams();
}
