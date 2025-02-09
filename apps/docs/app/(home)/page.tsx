import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "ark.env - Typesafe Environment Variables",
	description: "ark.env is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl font-bold">
				<code className="text-fd-foreground">ark.env</code>
			</h1>
			<p className="text-fd-muted-foreground">
				Typesafe Environment Variables
			</p>
			<div className="flex justify-center">
				<Link 
					href="/docs" 
					className="inline-block bg-fd-foreground text-fd-background px-4 py-2 rounded-md mt-4"
				>
					Set sail --&gt;
				</Link>
			</div>
		</main>
	);
}
