"use client";

import { useState } from "react";

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
					<img
						src="/assets/demo.gif"
						alt="ArkEnv Demo"
						width={958}
						className="block max-h-[600px] sm:max-h-[1000px] object-contain"
					/>
				) : (
					<video
						autoPlay
						loop
						muted
						playsInline
						width={958}
						poster="/assets/demo.png"
						className="block max-h-[600px] sm:max-h-[1000px] object-contain"
						onError={handleVideoError}
					>
						<source
							src="https://x9fkbqb4whr3w456.public.blob.vercel-storage.com/hero.mp4"
							type="video/mp4"
						/>
						You need a browser that supports HTML5 video to view this video.
					</video>
				)}
			</button>
		</div>
	);
}
