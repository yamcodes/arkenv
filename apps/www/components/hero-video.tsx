"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function HeroVideo() {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="w-full aspect-4/3" />;
	}

	return (
		<div className="relative w-full max-w-[600px] mx-auto aspect-[4/3]">
			<video
				src="/assets/3d-light.mp4"
				autoPlay
				loop
				muted
				playsInline
				className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
					resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
				}`}
			/>
			<video
				src="/assets/3d-dark.mp4"
				autoPlay
				loop
				muted
				playsInline
				className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
					resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
				}`}
			/>
		</div>
	);
}
