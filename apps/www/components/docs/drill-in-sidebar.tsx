"use client";

import { useTreeContext } from "fumadocs-ui/contexts/tree";
import {
	SidebarContent as SidebarContentPrimitive,
	SidebarDrawerContent,
	SidebarDrawerOverlay,
	SidebarViewport,
} from "fumadocs-ui/components/sidebar/base";
import type { SidebarProps } from "fumadocs-ui/layouts/docs/slots/sidebar";
import {
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "fumadocs-ui/layouts/docs/slots/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as PageTree from "fumadocs-core/page-tree";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { cn } from "~/lib/utils/cn";

type DrillOverride = "url" | "root" | PageTree.Folder;

/** Exact match for leaf active pills (avoids Overview matching every child URL). */
function isPathExact(url: string, pathname: string): boolean {
	const normalize = (path: string) =>
		path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
	return normalize(pathname) === normalize(url);
}

/** True when `pathname` is this URL or a descendant path. */
function isPathUnder(url: string, pathname: string): boolean {
	if (isPathExact(url, pathname)) return true;
	const prefix = url.endsWith("/") ? url : `${url}/`;
	return pathname.startsWith(prefix);
}

function folderContainsPath(folder: PageTree.Folder, pathname: string): boolean {
	if (folder.index && isPathUnder(folder.index.url, pathname)) return true;
	for (const child of folder.children) {
		if (child.type === "page" && isPathUnder(child.url, pathname)) return true;
		if (child.type === "folder" && folderContainsPath(child, pathname)) return true;
	}
	return false;
}

function findSectionForPath(
	nodes: PageTree.Node[],
	pathname: string,
): PageTree.Folder | null {
	for (const node of nodes) {
		if (node.type === "folder" && folderContainsPath(node, pathname)) {
			return node;
		}
	}
	return null;
}

function nodeKey(node: PageTree.Node, index: number): string {
	if (node.$id) return node.$id;
	if (node.type === "page") return `page:${node.url}`;
	if (node.type === "folder") {
		return `folder:${node.index?.url ?? String(node.name)}:${index}`;
	}
	return `sep:${String(node.name)}:${index}`;
}

/** Prefer `folder.index`; fall back when Fumadocs only exposes the overview as a child page. */
function resolveFolderIndex(folder: PageTree.Folder): PageTree.Item | undefined {
	if (folder.index) return folder.index;
	const pages = folder.children.filter(
		(child): child is PageTree.Item => child.type === "page",
	);
	return (
		pages.find((page) => String(page.name) === String(folder.name)) ?? pages[0]
	);
}

function nestedChildren(folder: PageTree.Folder): PageTree.Node[] {
	const index = resolveFolderIndex(folder);
	return folder.children.filter(
		(child) => !(child.type === "page" && index && child.url === index.url),
	);
}

function itemClassName(active: boolean): string {
	return cn(
		"group/item relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-start text-fd-foreground transition-colors",
		"hover:bg-fd-accent/50",
		active && "bg-fd-accent",
	);
}

/** Turbo-style group labels: smaller, dimmer, not interactive. */
function groupLabelClassName(): string {
	return "px-2.5 pt-4 pb-1 text-[13px] font-normal text-fd-muted-foreground empty:hidden select-none";
}

function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	return reduced;
}

function LeafItem({
	item,
	pathname,
}: {
	item: PageTree.Item;
	pathname: string;
}) {
	const active = !item.external && isPathExact(item.url, pathname);
	const external = item.external ?? /^https?:\/\//.test(item.url);
	const className = itemClassName(active);
	const content = (
		<>
			{item.icon}
			<span className="min-w-0 flex-1 text-pretty leading-snug">
				{item.name}
			</span>
			{external ? (
				<ArrowUpRight
					className="size-3.5 shrink-0 opacity-50"
					aria-hidden="true"
					data-no-arrow=""
				/>
			) : null}
		</>
	);

	if (external) {
		return (
			<a
				href={item.url}
				target="_blank"
				rel="noreferrer noopener"
				data-drill-item=""
				data-active={active}
				data-no-arrow=""
				className={className}
			>
				{content}
			</a>
		);
	}

	return (
		<Link
			href={item.url}
			data-drill-item=""
			data-active={active}
			aria-current={active ? "page" : undefined}
			className={className}
		>
			{content}
		</Link>
	);
}

function NestedGroup({
	folder,
	pathname,
}: {
	folder: PageTree.Folder;
	pathname: string;
}) {
	const index = resolveFolderIndex(folder);
	const children = nestedChildren(folder);

	// Turbo-style: Nested Groups are headers + always-visible children (max depth 2).
	// No collapse — collapsing clipped siblings under the drill-in height lock.
	return (
		<div className="flex flex-col gap-0.5">
			<p className={groupLabelClassName()}>
				{folder.name}
			</p>
			{index ? (
				<LeafItem
					item={{
						...index,
						icon: folder.icon ?? index.icon,
					}}
					pathname={pathname}
				/>
			) : null}
			{children.map((child, childIndex) => (
				<NestedChild
					key={nodeKey(child, childIndex)}
					node={child}
					pathname={pathname}
				/>
			))}
		</div>
	);
}

/** Children of a Nested Group: pages only (no further nesting). */
function NestedChild({
	node,
	pathname,
}: {
	node: PageTree.Node;
	pathname: string;
}) {
	if (node.type === "separator") {
		return (
			<p className={groupLabelClassName()}>
				{node.name}
			</p>
		);
	}
	if (node.type === "folder") {
		const index = resolveFolderIndex(node);
		if (!index) return null;
		return (
			<LeafItem
				item={{
					...index,
					name: node.name,
					icon: node.icon ?? index.icon,
				}}
				pathname={pathname}
			/>
		);
	}
	return <LeafItem item={node} pathname={pathname} />;
}

function SectionChild({
	node,
	pathname,
}: {
	node: PageTree.Node;
	pathname: string;
}) {
	if (node.type === "separator") {
		return (
			<p className={groupLabelClassName()}>
				{node.name}
			</p>
		);
	}
	if (node.type === "folder") {
		const index = resolveFolderIndex(node);
		const children = nestedChildren(node);
		// Index-only folders are leaves (no Nested Group chrome for an empty list).
		if (children.length === 0) {
			if (!index) return null;
			return (
				<LeafItem
					item={{
						...index,
						name: node.name,
						icon: node.icon ?? index.icon,
					}}
					pathname={pathname}
				/>
			);
		}
		return <NestedGroup folder={node} pathname={pathname} />;
	}
	return <LeafItem item={node} pathname={pathname} />;
}

function RootNode({
	node,
	pathname,
	onDrill,
}: {
	node: PageTree.Node;
	pathname: string;
	onDrill: (folder: PageTree.Folder) => void;
}) {
	if (node.type === "separator") {
		return (
			<p className={groupLabelClassName()}>
				{node.name}
			</p>
		);
	}

	if (node.type === "folder") {
		const under = folderContainsPath(node, pathname);
		const index = resolveFolderIndex(node);
		const className = itemClassName(under);
		const content = (
			<>
				{node.icon}
				<span className="min-w-0 flex-1 text-pretty text-start leading-snug">
					{node.name}
				</span>
				<ChevronRight
					className="size-4 shrink-0 opacity-60"
					aria-hidden="true"
				/>
			</>
		);

		// Match Turbo: Section click opens the Overview so a leaf is always selected.
		if (index) {
			return (
				<Link
					href={index.url}
					data-drill-item=""
					data-active={under}
					className={className}
				>
					{content}
				</Link>
			);
		}

		return (
			<button
				type="button"
				data-drill-item=""
				data-active={under}
				className={className}
				onClick={() => onDrill(node)}
			>
				{content}
			</button>
		);
	}

	return <LeafItem item={node} pathname={pathname} />;
}

function SectionPage({
	section,
	pathname,
	onBack,
}: {
	section: PageTree.Folder;
	pathname: string;
	onBack: () => void;
}) {
	const children = nestedChildren(section);
	const index = resolveFolderIndex(section);

	return (
		<>
			<button
				type="button"
				onClick={onBack}
				className={cn(
					"mb-1 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-fd-muted-foreground",
					"hover:text-fd-foreground",
				)}
				aria-label="Back to all documentation sections"
			>
				<ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
				<span className="truncate">{section.name}</span>
			</button>
			{index ? (
				<LeafItem
					item={{
						...index,
						name: "Overview",
					}}
					pathname={pathname}
				/>
			) : null}
			{children.map((child, childIndex) => (
				<SectionChild
					key={nodeKey(child, childIndex)}
					node={child}
					pathname={pathname}
				/>
			))}
		</>
	);
}

const panelMotionClass =
	"transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

function DrillInTree() {
	const { root } = useTreeContext();
	const pathname = usePathname();
	const urlSection = findSectionForPath(root.children, pathname);
	const [override, setOverride] = useState<DrillOverride>("url");
	const reduceMotion = usePrefersReducedMotion();
	const rootRef = useRef<HTMLElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const [height, setHeight] = useState<number>();

	useEffect(() => {
		setOverride("url");
	}, [pathname]);

	const section =
		override === "root" ? null : override === "url" ? urlSection : override;
	const drilled = Boolean(section);

	// Keep the sliding viewport tall enough for the visible panel (incl. Nested Groups).
	useLayoutEffect(() => {
		const el = drilled ? sectionRef.current : rootRef.current;
		if (!el) return;

		const sync = () => setHeight(el.scrollHeight);
		sync();

		const observer = new ResizeObserver(sync);
		observer.observe(el);
		return () => observer.disconnect();
	}, [drilled, section, pathname, root.children]);

	const drillTo = (folder: PageTree.Folder) => {
		setOverride(folder);
	};

	const goBack = () => {
		setOverride("root");
	};

	return (
		<div
			className="relative overflow-hidden"
			style={height != null ? { height } : undefined}
		>
			<nav
				ref={rootRef}
				aria-label="Documentation sections"
				className={cn(
					"flex w-full flex-col gap-0.5",
					!reduceMotion && panelMotionClass,
					drilled ? "absolute inset-x-0 top-0" : "relative",
					drilled && "pointer-events-none",
				)}
				style={{
					transform: drilled ? "translateX(-100%)" : "translateX(0)",
				}}
				aria-hidden={drilled}
				{...(drilled ? { inert: true as const } : {})}
			>
				{root.children.map((node, index) => (
					<RootNode
						key={nodeKey(node, index)}
						node={node}
						pathname={pathname}
						onDrill={drillTo}
					/>
				))}
			</nav>
			<nav
				ref={sectionRef}
				aria-label={
					section ? `${String(section.name)} pages` : "Section pages"
				}
				className={cn(
					"absolute inset-x-0 top-0 flex w-full flex-col gap-0.5",
					!reduceMotion && panelMotionClass,
					!drilled && "pointer-events-none",
				)}
				style={{
					transform: drilled ? "translateX(0)" : "translateX(100%)",
				}}
				aria-hidden={!drilled}
				{...(!drilled ? { inert: true as const } : {})}
			>
				{section ? (
					<SectionPage
						section={section}
						pathname={pathname}
						onBack={goBack}
					/>
				) : null}
			</nav>
		</div>
	);
}

function SidebarDrawer({
	children,
	className,
	...props
}: {
	children: ReactNode;
	className?: string;
} & React.ComponentProps<"aside">) {
	return (
		<>
			<SidebarDrawerOverlay className="fixed z-40 inset-0 backdrop-blur-xs data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out" />
			<SidebarDrawerContent
				id="nd-sidebar-mobile"
				className={cn(
					"fixed z-40 inset-y-0 inset-s-0 flex w-[85%] max-w-[380px] flex-col border-e bg-fd-background text-[0.9375rem] shadow-lg data-[state=closed]:animate-fd-sidebar-out data-[state=open]:animate-fd-sidebar-in",
					className,
				)}
				{...props}
			>
				{children}
			</SidebarDrawerContent>
		</>
	);
}

/**
 * Mirrors Fumadocs `layouts/docs/slots/sidebar` SidebarContent shell so the
 * docs layout grid (`[grid-area:sidebar]`) and collapse behavior stay intact.
 */
function DocsSidebarShell({
	children,
	className,
	...props
}: {
	children: ReactNode;
	className?: string;
} & React.ComponentProps<"aside">) {
	return (
		<SidebarContentPrimitive>
			{({
				ref,
				collapsed,
				hovered,
				onPointerEnter,
				onPointerLeave,
			}) => (
				<div
					data-sidebar-placeholder=""
					className="sticky top-(--fd-docs-row-1) z-20 [grid-area:sidebar] pointer-events-none *:pointer-events-auto h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] md:layout:[--fd-sidebar-width:300px] max-md:hidden"
				>
					<aside
						id="nd-sidebar"
						ref={ref}
						data-collapsed={collapsed}
						data-hovered={collapsed && hovered}
						onPointerEnter={onPointerEnter}
						onPointerLeave={onPointerLeave}
						className={cn(
							"absolute inset-s-0 inset-y-0 flex w-full flex-col items-end border-e bg-fd-card text-sm duration-250 *:w-(--fd-sidebar-width)",
							collapsed && [
								"inset-y-2 w-(--fd-sidebar-width) rounded-xl border transition-transform",
								hovered
									? "shadow-lg translate-x-2 rtl:-translate-x-2"
									: "-translate-x-(--fd-sidebar-width) rtl:translate-x-full",
							],
							className,
						)}
						{...props}
					>
						{children}
					</aside>
				</div>
			)}
		</SidebarContentPrimitive>
	);
}

/**
 * Turborepo-style Drill-in Sidebar for Fumadocs `DocsLayout`.
 * Use via {@link drillInSidebarSlots}.
 */
function DrillInViewport() {
	return (
		<SidebarViewport className="p-3 pe-2">
			<div className="flex flex-col gap-0.5">
				<DrillInTree />
			</div>
		</SidebarViewport>
	);
}

/** @see drillInSidebarSlots */
export function DrillInSidebar({
	footer: _footer,
	banner: _banner,
	collapsible: _collapsible,
	components: _components,
	...rest
}: SidebarProps) {
	return (
		<>
			<DocsSidebarShell {...rest}>
				<DrillInViewport />
			</DocsSidebarShell>
			<SidebarDrawer>
				<div className="flex flex-col gap-3 p-4 pb-2" />
				<DrillInViewport />
			</SidebarDrawer>
		</>
	);
}

/**
 * Full `slots.sidebar` object for `DocsLayout`, keeping Fumadocs provider/trigger
 * while swapping in {@link DrillInSidebar}.
 */
export const drillInSidebarSlots = {
	provider: SidebarProvider,
	root: DrillInSidebar,
	trigger: SidebarTrigger,
	useSidebar,
};
