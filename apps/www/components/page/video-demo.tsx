"use client";

export function VideoDemo() {
	const handleVideoClick = () => {
		const stackblitzUrl =
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts&embed=1&theme=dark&view=editor&terminalHeight=4&hideExplorer=false&forceEmbedLayout=true&showSidebar=true&hideNavigation=true";
		window.open(stackblitzUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="inline-block relative mb-4">
			{/* Shadow element for glow effect */}
			<div className="absolute inset-0 rounded-lg pointer-events-none shadow-[0_0_20px_rgba(96,165,250,0.6)] dark:shadow-[0_0_100px_rgba(96,165,250,0.2)]" />

			{/* Main video container */}
			<button
				type="button"
				className="rounded-lg overflow-hidden border border-fd-border shadow-lg bg-black/5 dark:bg-black/20 cursor-pointer"
				onClick={handleVideoClick}
			>
				<video
					autoPlay
					loop
					muted
					playsInline
					className="block max-h-[600px] sm:max-h-[1000px] object-contain"
				>
					<source src="/arkenv-video.mov" type="video/quicktime" />
					<source src="/arkenv-video.mov" type="video/mp4" />
					Your browser does not support the video tag.
				</video>
			</button>
		</div>
	);
}
