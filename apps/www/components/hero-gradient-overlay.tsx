import type { FC } from "react";

export const HeroGradientOverlay: FC = () => {
	return (
		<svg
			viewBox="0 0 1440 181"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="pointer-events-none absolute w-full top-0 left-0 h-40 z-10 opacity-100 text-blue-50 dark:text-[#011537]"
			preserveAspectRatio="none"
			aria-hidden="true"
			role="presentation"
			focusable="false"
		>
			<mask id="path-1-inside-1" fill="white">
				<path d="M0 0H1440V181H0V0Z" />
			</mask>
			<path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear)" fillOpacity="1" />
			<path
				d="M0 2H1440V-2H0V2Z"
				fill="url(#paint1_linear)"
				mask="url(#path-1-inside-1)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear"
					x1="720"
					y1="0"
					x2="720"
					y2="181"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="currentColor" />
					<stop offset="1" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
				<linearGradient
					id="paint1_linear"
					x1="0"
					y1="90.5"
					x2="1440"
					y2="90.5"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#60a5fa" stopOpacity="0" />
					<stop offset="0.5" stopColor="#60a5fa" />
					<stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
};
