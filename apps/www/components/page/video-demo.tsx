"use client";

import Image from "next/image";
import BackgroundVideo from "next-video/background-video";
import { useState } from "react";
import demo from "~/videos/demo.mp4";

// Actual video dimensions
const WIDTH = 2048;
const HEIGHT = 1672;

const getAspectRatio = (width: number, height: number) =>
	`${width} / ${height}`;

export function VideoDemo() {
	const [videoError, setVideoError] = useState(false);

	const handleVideoClick = () => {
		const stackblitzUrl =
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts";
		window.open(stackblitzUrl, "_blank", "noopener,noreferrer");
	};

	const handleVideoError = () => {
		setVideoError(true);
	};

	return (
		<div className="relative mb-4 w-full mx-auto">
			{/* Main video container with aspect ratio */}
			<button
				type="button"
				className="relative rounded-lg overflow-hidden border border-fd-border shadow-lg bg-black/5 dark:bg-black/20 cursor-pointer m-0 p-0 w-full shadow-[0_0_20px_rgba(96,165,250,0.6)] dark:shadow-[0_0_100px_rgba(96,165,250,0.2)]"
				onClick={handleVideoClick}
				aria-label="Open interactive demo in a new tab"
				style={{ aspectRatio: getAspectRatio(WIDTH, HEIGHT) }}
			>
				{videoError ? (
					<Image
						src="/assets/demo.gif"
						alt="ArkEnv Demo"
						fill
						className="object-contain"
						sizes="100vw"
						unoptimized
					/>
				) : (
					<BackgroundVideo
						src={demo}
						poster="/assets/demo.png"
						onError={handleVideoError}
						autoPlay
						loop
						muted
						playsInline
						className="absolute inset-0 w-full h-full object-contain"
					/>
				)}
			</button>
		</div>
	);
}
