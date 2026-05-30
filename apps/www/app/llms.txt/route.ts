import { llms } from "fumadocs-core/source";
import { source } from "~/lib/source";

export const revalidate = false;

/**
 * Handle GET requests for root llms.txt.
 *
 * @returns A Response containing the plain-text index of all documentation pages
 */
export async function GET() {
	const indexContent = llms(source).index();

	return new Response(indexContent, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}
