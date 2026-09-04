"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useIsMobile } from "~/hooks/use-is-mobile";

const HOST_MESSAGE = 'must be a string or "localhost" (was missing)';
const PORT_MESSAGE = "must be a number (was a string)";

const tipClassName =
	"home-aurora__json-ellipsis-tip min-w-0 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border-fd-border bg-fd-popover p-2 text-xs leading-snug text-fd-popover-foreground shadow-md backdrop-blur-none";

function EllipsisMessage({
	message,
	mode,
}: {
	message: string;
	mode: "hover" | "tap";
}) {
	const trigger = (
		<button
			type="button"
			className="home-aurora__json-ellipsis"
			aria-label={`Full message: ${message}`}
		>
			…
		</button>
	);

	if (mode === "hover") {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{trigger}</TooltipTrigger>
				<TooltipContent side="top" sideOffset={6} className={tipClassName}>
					{message}
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				align="start"
				side="top"
				collisionPadding={12}
				className={tipClassName}
			>
				{message}
			</PopoverContent>
		</Popover>
	);
}

function IssuesJson({
	layout,
	mode,
}: {
	layout: "compact" | "stacked";
	mode: "hover" | "tap";
}) {
	const host = <EllipsisMessage message={HOST_MESSAGE} mode={mode} />;
	const port = <EllipsisMessage message={PORT_MESSAGE} mode={mode} />;

	if (layout === "compact") {
		return (
			<code>
				{
					'{\n  "success": false,\n  "issues": [\n    { "path": "HOST", "code": "MISSING_VARIABLE", "message": "'
				}
				{host}
				{'" },\n    { "path": "PORT", "code": "INVALID_TYPE", "message": "'}
				{port}
				{'" }\n  ]\n}'}
			</code>
		);
	}

	return (
		<code>
			{
				'{\n  "success": false,\n  "issues": [\n    {\n      "path": "HOST",\n      "code": "MISSING_VARIABLE",\n      "message": "'
			}
			{host}
			{
				'"\n    },\n    {\n      "path": "PORT",\n      "code": "INVALID_TYPE",\n      "message": "'
			}
			{port}
			{'"\n    }\n  ]\n}'}
		</code>
	);
}

/**
 * Machine-readable validation errors for CI and agents.
 * Desktop: hover tooltip + compact issue objects.
 * Mobile: tap popover + stacked path/code/message.
 */
export function RuntimeBloatShowcase() {
	const isMobile = useIsMobile();
	const mode = isMobile ? "tap" : "hover";
	const layout = isMobile ? "stacked" : "compact";

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-errors"
			id="errors"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-errors" data-reveal="blur">
					Structured errors
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Each issue gets a code that agents and CI can act on. Missing keys and
					bad values aren&apos;t the same.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__json"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="JSON issues for HOST missing and PORT invalid type"
				data-layout={layout}
			>
				<span className="home-aurora__json-lang" aria-hidden="true">
					json
				</span>
				<pre className="home-aurora__json-body home-aurora__tty--wrap">
					{mode === "hover" ? (
						<TooltipProvider delayDuration={200}>
							<IssuesJson layout={layout} mode={mode} />
						</TooltipProvider>
					) : (
						<IssuesJson layout={layout} mode={mode} />
					)}
				</pre>
			</figure>
		</section>
	);
}
