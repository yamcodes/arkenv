import { highlightTs } from "./highlight-ts";
import { SecureBoundaryView } from "./secure-boundary-view";

const FLAT_ENV_CODE = `import arkenv from "@/generated/env.gen";

export const env = arkenv({
  NEXT_PUBLIC_API_URL: "string.url",
  DATABASE_URL: "string.url",
  STRIPE_SECRET_KEY: "string",
});`;

const COMPILED_BUNDLE_CODE = `export const env = {
  NEXT_PUBLIC_API_URL: "https://api.acme.com",
  // 🔒 Secrets omitted from client bundle!
};`;

/**
 * Client / server env boundary pitch showcasing the recommended Flat Layout.
 */
export async function SecureBoundary() {
	const [envHtml, bundleHtml] = await Promise.all([
		highlightTs(FLAT_ENV_CODE),
		highlightTs(COMPILED_BUNDLE_CODE),
	]);

	return <SecureBoundaryView envHtml={envHtml} bundleHtml={bundleHtml} />;
}
