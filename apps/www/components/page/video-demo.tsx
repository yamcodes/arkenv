"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import BackgroundVideo from "next-video/background-video";
import { useState } from "react";
import demo from "~/videos/demo.mp4";

// Actual video dimensions
const WIDTH = 2048;
const HEIGHT = 1672;

const getAspectRatio = (width: number, height: number) =>
	`${width} / ${height}`;

/**
 * VideoDemo component displays an interactive video demonstration with a browser-style frame.
 * Clicking the video opens the demo in StackBlitz. Falls back to a GIF if video fails to load.
 */
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
		<div className="relative mb-4 w-full mx-auto max-w-4xl pt-8">
			<button
				type="button"
				className="relative rounded-xl overflow-hidden border border-fd-border/50 bg-black/10 dark:bg-black/40 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] group w-full text-left outline-none cursor-pointer"
				onClick={handleVideoClick}
				aria-label="Open interactive demo in a new tab"
			>
				{/* Header / Title Bar */}
				<div className="flex items-center px-4 py-2 bg-white/5 border-b border-fd-border/50">
					<div className="flex gap-1.5">
						<div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
						<div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
						<div className="w-3 h-3 rounded-full bg-[#27c93f]" />
					</div>
					<div className="mx-auto text-xs font-mono text-gray-500 dark:text-gray-400 select-none">
						basic — index.ts
					</div>
				</div>

				{/* Video Container */}
				<div
					className="relative w-full block"
					style={{ aspectRatio: getAspectRatio(WIDTH, HEIGHT) }}
				>
					{videoError ? (
						<Image
							src="/assets/demo.gif"
							alt="ArkEnv Demo"
							fill
							className="absolute inset-0 w-full h-full object-cover"
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
							className="absolute inset-0 w-full h-full object-cover"
						/>
					)}
					{/* Interactive Overlay Hint */}
					<div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-300 flex items-center justify-center">
						<div className="bg-white/90 dark:bg-black/90 text-black dark:text-white px-4 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg flex items-center gap-2">
							<span>Open Interactive Playground</span>
							<ArrowUpRight className="w-4 h-4 opacity-70" />
						</div>
					</div>
				</div>
			</button>
		</div>
	);
}
