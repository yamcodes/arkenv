import { ChevronRight, Copy, Sailboat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "~/components/page/copy-button";
import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
	title: "ark.env: Typesafe Environment Variables",
	description:
		"ark.env is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl font-bold">
				<code className="text-fd-foreground">ark.env</code>
			</h1>
			<p className="text-fd-muted-foreground">Typesafe Environment Variables</p>
			<div className="flex justify-center my-4 gap-4">
				<Button
					asChild
					variant="outline"
					className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 dark:hover:text-primary-foreground"
				>
					<Link href="/docs/setup">
						<Sailboat />
						Set sail --&gt;
					</Link>
				</Button>
			</div>
			<p className="text-fd-muted-foreground text-sm mb-2">...or simply run:</p>
			<div className="mx-auto w-fit rounded-lg bg-black p-4 ring-1 ring-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-blue-500/20">
				<div className="flex items-center justify-between gap-2 mb-4">
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-red-400/30" />
						<div className="h-3 w-3 rounded-full bg-yellow-500/30" />
						<div className="h-3 w-3 rounded-full bg-green-400/30" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<code>
						<span className="text-green-300 select-none font-bold">❯ </span>
						<span className="text-green-400">npm</span>
						<span className="text-white"> install ark.env arktype</span>
						<span className="inline-block w-4" />
						<CopyButton command="npm install ark.env arktype" />
					</code>
				</div>
			</div>
		</main>
	);
}
