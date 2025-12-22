"use client";

import { Banner as FumadocsBanner } from "fumadocs-ui/components/banner";
import { useRouter } from "next/navigation";

export function Banner() {
	const router = useRouter();
	return (
		<FumadocsBanner
			variant="rainbow"
			id="coercion-banner"
			onClick={() => router.push("/docs/arkenv/coercion")}
			className="cursor-pointer"
		>
			🎉 Coercion is here: Auto convert strings to numbers, booleans, etc.
		</FumadocsBanner>
	);
}
