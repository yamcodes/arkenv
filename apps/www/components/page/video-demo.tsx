"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import BackgroundVideo from "next-video/background-video";
import { useState } from "react";
import demo from "~/videos/demo.mp4";

const WIDTH = 2048;
const HEIGHT = 1672;

const getAspectRatio = (width: number, height: number) =>
	`${width} / ${height}`;

/**
 * Product demo framed for the home workbench — no redrawn browser chrome.
 * Click opens the StackBlitz playground.
 */
export function VideoDemo() {
	const [videoError, setVideoError] = useState(false);

	const handleVideoClick = () => {
		const stackblitzUrl =
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/stackblitz?file=index.ts";
		window.open(stackblitzUrl, "_blank", "noopener,noreferrer");
	};

	const handleVideoError = () => {
		setVideoError(true);
	};

	return (
		<figure className="home-aurora__frame">
			<button
				type="button"
				className="home-aurora__frame-button"
				style={{ aspectRatio: getAspectRatio(WIDTH, HEIGHT) }}
				onClick={handleVideoClick}
				aria-label="Open interactive demo in a new tab"
			>
				<div className="home-aurora__frame-media">
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
					<div className="home-aurora__frame-hint">
						<span>
							Open interactive playground
							<ArrowUpRight className="w-4 h-4 opacity-70" />
						</span>
					</div>
				</div>
			</button>
			<figcaption className="home-aurora__caption">
				basic · index.ts — click to open the live playground
			</figcaption>
		</figure>
	);
}
