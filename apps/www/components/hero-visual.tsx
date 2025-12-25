"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export function HeroVisual() {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - 0.5;
		const y = (e.clientY - rect.top) / rect.height - 0.5;
		setMousePos({ x, y });
	};

	const handleMouseLeave = () => {
		setMousePos({ x: 0, y: 0 });
	};

	if (!mounted) {
		return <div className="w-full aspect-square" />;
	}

	return (
		<div
			ref={containerRef}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className="relative w-full max-w-[500px] mx-auto lg:ml-auto lg:mt-8 aspect-square flex items-center justify-center perspective-[1000px] group select-none"
		>
			{/* Ambient Glow Background */}
			<div
				className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-[80px] transform-gpu transition-transform duration-500"
				style={{
					transform: `translate3d(${mousePos.x * 40}px, ${mousePos.y * 40}px, 0)`,
				}}
			/>

			{/* The 2.5D Platform / Card */}
			<div
				className="relative w-[300px] h-[300px] transition-transform duration-300 ease-out transform-gpu"
				style={{
					transformStyle: "preserve-3d",
					transform: `rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`,
				}}
			>
				{/* Glass Base Layer */}
				<div
					className="absolute inset-0 bg-white/5 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-2xl"
					style={{ transform: "translateZ(0px)" }}
				/>

				{/* Floating SVG Icon */}
				<div
					className="absolute inset-0 flex items-center justify-center transform-gpu"
					style={{ transform: "translateZ(60px)" }}
				>
					<svg
						width="160"
						height="160"
						viewBox="0 0 12 12"
						className="drop-shadow-[0_20px_40px_rgba(59,130,246,0.3)] filter brightness-110 animate-spin-slow origin-center"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							className="stroke-blue-500 dark:stroke-blue-400"
							style={{
								fill: "none",
								strokeWidth: ".9",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeMiterlimit: "10",
							}}
							d="M8.5 6c0-1.379-1.121-2.5-2.5-2.5A2.502 2.502 0 0 0 3.5 6c0 1.379 1.121 2.5 2.5 2.5S8.5 7.379 8.5 6ZM6 11V8.5M1 6h2.5m5 0H11M6 3.5V1M2.464 2.464l1.768 1.768m3.536 3.536 1.768 1.768m-7.072 0 1.768-1.768m3.536-3.536 1.768-1.768"
						/>
						<circle
							cx="6"
							cy="6"
							r="0.9"
							className="fill-blue-500 dark:fill-blue-400 animate-pulse"
						/>
					</svg>
				</div>

				{/* Floating Accents (Code Samples / Particles) */}
				<div
					className="absolute -top-4 -right-4 bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-xl shadow-xl transform-gpu transition-all duration-300 group-hover:translate-x-4 opacity-80 group-hover:opacity-100"
					style={{
						transform: "translateZ(90px) rotate(-5deg)",
					}}
				>
					<div className="text-[10px] font-mono leading-tight">
						<span className="text-yellow-600 dark:text-yellow-600">const</span>{" "}
						<span className="text-blue-800 dark:text-white">env</span>{" "}
						<span className="text-yellow-600 dark:text-yellow-600">=</span>{" "}
						<span className="text-blue-500 dark:text-blue-300 italic">
							arkenv
						</span>
						<span className="text-yellow-600 dark:text-yellow-300">(</span>
						<span className="text-yellow-600 dark:text-yellow-600">{"{"}</span>
						<br />
						&nbsp;&nbsp;
						<span className="text-blue-950 dark:text-white">PORT:</span>{" "}
						<span className="text-yellow-600 dark:text-yellow-600">"</span>
						<span className="text-blue-800 dark:text-blue-400">number</span>
						<span className="text-yellow-600 dark:text-yellow-600">"</span>
						<br />
						<span className="text-yellow-600 dark:text-yellow-600">{"}"}</span>
						<span className="text-yellow-600 dark:text-yellow-300">)</span>
					</div>
				</div>

				<div
					className="absolute -bottom-10 -left-12 transform-gpu transition-all duration-300 group-hover:-translate-x-4 group-hover:-translate-y-2 opacity-90 group-hover:opacity-100"
					style={{ transform: "translateZ(40px) rotate(4deg)" }}
				>
					{/* The 'Code' line */}
					<div className="bg-white/10 border border-white/20 rounded-md px-3 py-1.5 backdrop-blur-xl shadow-xl font-mono text-[11px]">
						<span className="text-blue-950 dark:text-white">env</span>
						<span className="text-yellow-500 dark:text-yellow-600">.</span>
						<span className="text-yellow-600 dark:text-yellow-300">PORT</span>
					</div>

					{/* The Tooltip popover */}
					<div
						className="absolute bottom-full left-4 mb-2 border border-white/10 rounded-sm p-2 shadow-2xl transition-all duration-500 transform-gpu group-hover:scale-110 group-hover:-translate-y-1 bg-[#1e1e1e] dark:bg-[#1e1e1e] light:bg-[#f3f3f3]"
						style={{
							transform: "translateZ(30px)",
							backgroundColor: resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff",
							borderColor:
								resolvedTheme === "dark"
									? "rgba(255,255,255,0.1)"
									: "rgba(0,0,0,0.1)",
						}}
					>
						<div className="flex flex-col gap-0.5 whitespace-nowrap">
							<div className="text-[10px] font-mono leading-none">
								<span
									className={
										resolvedTheme === "dark" ? "text-blue-400" : "text-blue-600"
									}
								>
									(property)
								</span>{" "}
								<span
									className={
										resolvedTheme === "dark" ? "text-white" : "text-gray-900"
									}
								>
									PORT
								</span>
								:{" "}
								<span
									className={
										resolvedTheme === "dark" ? "text-blue-300" : "text-blue-500"
									}
								>
									number
								</span>
							</div>
						</div>
						{/* Small arrow */}
						<div
							className="absolute top-full left-4 w-2 h-2 rotate-45 -translate-y-1 border-r border-b"
							style={{
								backgroundColor:
									resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff",
								borderColor:
									resolvedTheme === "dark"
										? "rgba(255,255,255,0.1)"
										: "rgba(0,0,0,0.1)",
							}}
						/>
					</div>
				</div>
			</div>

			{/* Ground Reflection / Shadow */}
			<div
				className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/20 dark:bg-black/60 blur-3xl opacity-50 rounded-full"
				style={{ transform: "rotateX(90deg) translateZ(-150px)" }}
			/>
		</div>
	);
}
