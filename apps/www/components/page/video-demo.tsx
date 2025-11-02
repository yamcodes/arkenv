"use client";

import Image from "next/image";
import BackgroundVideo from "next-video/background-video";
import { useState } from "react";
import demo from "~/videos/demo.mp4";

const WIDTH = 800;
const HEIGHT = 653;

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
		<div className="inline-block relative mb-4">
			{/* Main video container */}
			<button
				type="button"
				className="relative rounded-lg overflow-hidden border border-fd-border shadow-lg bg-black/5 dark:bg-black/20 cursor-pointer m-0 p-0 shadow-[0_0_20px_rgba(96,165,250,0.6)] dark:shadow-[0_0_100px_rgba(96,165,250,0.2)]"
				onClick={handleVideoClick}
				aria-label="Open interactive demo in a new tab"
			>
				{videoError ? (
					<Image
						src="/assets/demo.gif"
						alt="ArkEnv Demo"
						width={WIDTH}
						height={HEIGHT}
						className="block max-h-[600px] sm:max-h-[1000px] object-contain"
					/>
				) : (
					<BackgroundVideo
						src={demo}
						width={WIDTH}
						height={HEIGHT}
						poster="/assets/demo.png"
						onError={handleVideoError}
						autoPlay
						loop
						muted
						playsInline
						className="block max-h-[600px] sm:max-h-[1000px] object-contain"
					/>
				)}
			</button>
		</div>
	);
}
