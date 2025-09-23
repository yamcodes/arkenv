"use client";

export function VideoDemo() {
	const handleVideoClick = () => {
		const stackblitzUrl =
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts";
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
				aria-label="Play demo video"
			>
				<video
					autoPlay
					loop
					muted
					playsInline
					className="block max-h-[600px] sm:max-h-[1000px] object-contain"
				>
					<source src="/assets/demo.mov" type="video/quicktime" />
					Your browser does not support the video tag.
				</video>
			</button>
		</div>
	);
}
