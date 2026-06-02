import { highlight } from "~/lib/shiki";
import { TwoslashHover } from "./twoslash-hover";

export async function CodeFrame({
	label,
	code,
	language,
	caption,
}: {
	label: string;
	code: string;
	language: string;
	caption: string;
}) {
	const highlighted = await highlight(code, language);

	return (
		<figure className="relative w-full max-w-2xl mx-auto">
			<div
				className="relative rounded-[var(--radius-card)] border overflow-hidden"
				style={{
					borderColor: "var(--color-rule)",
					backgroundColor: "var(--color-paper-2)",
				}}
			>
				<div
					className="flex items-center px-4 py-2 border-b text-xs font-mono tracking-tight"
					style={{
						borderColor: "var(--color-rule)",
						color: "var(--color-ink-2)",
					}}
				>
					{label}
				</div>
				<TwoslashHover
					html={highlighted}
					className="overflow-x-auto [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:text-sm [&_pre]:leading-relaxed"
				/>
			</div>
			<figcaption
				className="mt-3 text-sm text-center"
				style={{ color: "var(--color-ink-2)" }}
			>
				{caption}
			</figcaption>
		</figure>
	);
}
