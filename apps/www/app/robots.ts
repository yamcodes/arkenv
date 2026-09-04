import type { MetadataRoute } from "next";
import { env } from "~/env";

export default function robots(): MetadataRoute.Robots {
	const isPreview =
		env.NEXT_PUBLIC_VERCEL_ENV === "preview" || env.VERCEL_ENV === "preview";

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
