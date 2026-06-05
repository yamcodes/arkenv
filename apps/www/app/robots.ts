import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const isPreview =
		process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
		process.env.VERCEL_ENV === "preview";

	if (isPreview) {
		return {
			rules: {
				userAgent: "*",
				disallow: "/",
			},
		};
	}

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
	};
}
