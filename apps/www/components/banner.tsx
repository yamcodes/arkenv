"use client";

import { Banner as FumadocsBanner } from "fumadocs-ui/components/banner";
import { useRouter } from "next/navigation";

export function Banner() {
	const router = useRouter();
	return (
		<FumadocsBanner
			variant="rainbow"
			id="bun-support-banner"
			onClick={() => router.push("/docs/bun-plugin")}
			className="cursor-pointer"
		>
			🎉 Official Bun support is here: ArkEnv at build time, fullstack dev
			server
		</FumadocsBanner>
	);
}
