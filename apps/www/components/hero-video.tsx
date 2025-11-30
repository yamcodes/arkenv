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

	const videoSrc =
		resolvedTheme === "dark" ? "/assets/3d-dark.mp4" : "/assets/3d-light.mp4";

	return (
		<div className="relative w-full max-w-[600px] mx-auto">
			{/* Gradient overlay handling for dark mode */}
			<div className="absolute inset-0 bg-linear-to-t from-background to-transparent pointer-events-none dark:opacity-100 opacity-0" />
			<video
				src={videoSrc}
				autoPlay
				loop
				muted
				playsInline
				className="w-full h-full object-contain"
			/>
		</div>
	);
}
