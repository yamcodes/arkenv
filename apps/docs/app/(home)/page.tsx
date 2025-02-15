import type { Metadata } from "next";
import { CopyButton } from "~/components/page/copy-button";
import { Logo } from "~/components/page/logo";
import { SailButton } from "~/components/page/sail-button";

export const metadata: Metadata = {
	title: "ark.env: Typesafe Environment Variables",
	description:
		"ark.env is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl sm:mt-0 mt-16">
				<Logo />
			</h1>
			<p className="text-fd-muted-foreground">Typesafe Environment Variables</p>
			<div className="flex justify-center my-4 gap-4 sm:mb-6 mb-16">
				<SailButton />
			</div>
			<p className="text-fd-muted-foreground text-sm mb-2">...or simply run:</p>
			<div className="mx-auto w-full sm:w-fit max-w-full rounded-none sm:rounded-lg bg-black p-4 ring-1 ring-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-blue-500/20 sm:min-h-fit flex-1 sm:flex-none">
				<div className="hidden sm:flex items-center justify-between gap-2 mb-4">
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-red-400/30" />
						<div className="h-3 w-3 rounded-full bg-yellow-500/30" />
						<div className="h-3 w-3 rounded-full bg-green-400/30" />
					</div>
				</div>
				<div className="relative flex items-center">
					<div className="overflow-x-auto pr-12">
						<code className="text-sm whitespace-nowrap">
							<span className="text-green-300 select-none font-bold">❯ </span>
							<span className="text-green-400">npm</span>
							<span className="text-white"> install ark.env arktype</span>
						</code>
					</div>
					<div className="absolute right-0 bg-black">
						<CopyButton command="npm install ark.env arktype" />
					</div>
				</div>
			</div>
		</main>
	);
}
