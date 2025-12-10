"use client";

import { Banner as FumadocsBanner } from "fumadocs-ui/components/banner";
import { useRouter } from "next/navigation";

export function Banner() {
	const router = useRouter();
	return (
		<FumadocsBanner
			variant="rainbow"
			id="standard-schema-support-banner"
			onClick={() => router.push("/docs/integrations/standard-schema")}
			className="cursor-pointer"
		>
			🎉 Standard Schema support is here: Use ArkEnv with Zod, Valibot, and
			more!
		</FumadocsBanner>
	);
}
