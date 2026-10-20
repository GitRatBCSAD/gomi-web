import { useNavigate } from "@tanstack/react-router";
import { hierarchy, treemap, treemapBinary, treemapSquarify } from "d3-hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { useMemo, useRef, useState, type JSX } from "react";

import { P } from "@/components/typography";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { FileRiskResult } from "@/lib/github/model";
import type { RiskScale } from "@/lib/interpret";

import { HeatmapListView } from "./heatmap-list-view";
import { Tile } from "./heatmap-tile";
import { HeatmapToolbar } from "./heatmap-toolbar";
import {
	DIR_LABEL_HEIGHT,
	getCategory,
	toFileInfo,
	type FilterKey,
	type SortOption,
	type TreeNode,
} from "./heatmap-utils";

const TREEMAP_CAP = 500;

export function Heatmap(props: {
	fileResults: FileRiskResult[];
	scale: RiskScale;
	repository: string;
	filter?: FilterKey;
	onFilterChange?: (filter: FilterKey) => void;
}): JSX.Element {
	const [internalFilter, setInternalFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOption>("risk-desc");
	// ponytail: hoisted — avoids N useNavigate hook calls inside each Tile
	const navigate = useNavigate();

	const activeFilter = props.filter ?? internalFilter;
	const handleFilterChange = (f: FilterKey) => {
		setInternalFilter(f);
		props.onFilterChange?.(f);
	};

	// ponytail: memoized — toFileInfo is O(N*commits), avoid re-running on every render
	const data = useMemo(
		() => props.fileResults.map((r) => toFileInfo(r, props.scale)),
		[props.fileResults, props.scale],
	);

	const counts = useMemo<Record<FilterKey, number>>(
		() => ({
			all: data.length,
			risky: data.filter((f) => getCategory(f) === "risky").length,
			acceptable: data.filter((f) => getCategory(f) === "acceptable").length,
			"low-conf": data.filter((f) => getCategory(f) === "low-conf").length,
		}),
		[data],
	);

	const visible = useMemo(
		() =>
			data
				.filter((f) => {
					if (activeFilter !== "all" && getCategory(f) !== activeFilter) return false;
					if (search) {
						const fullPath = `${f.dir}${f.name}`.toLowerCase();
						if (!fullPath.includes(search.toLowerCase())) return false;
					}
					return true;
				})
				.sort((a, b) => {
					if (sort === "risk-desc") return (b.risk ?? 0) - (a.risk ?? 0);
					if (sort === "risk-asc") return (a.risk ?? 0) - (b.risk ?? 0);
					if (sort === "complexity-desc")
						return (b.complexity ?? 0) - (a.complexity ?? 0);
					if (sort === "commits-desc") return (b.commits ?? 0) - (a.commits ?? 0);
					if (sort === "name-asc") return (a.name ?? "").localeCompare(b.name ?? "");
					return 0;
				}),
		[data, activeFilter, search, sort],
	);

	// ponytail: treemap cap — absolute-positioned tiles can't be virtualized; top N by risk is what matters
	const treemapFiles = useMemo(() => visible.slice(0, TREEMAP_CAP), [visible]);
	const isCapped = visible.length > TREEMAP_CAP;

	const [containerWidth, setContainerWidth] = useState(0);
	const roRef = useRef<ResizeObserver | null>(null);

	const attachRef = (el: HTMLDivElement | null) => {
		roRef.current?.disconnect();
		if (!el) return;
		// Measure now instead of waiting for the observer's first callback, so the first
		// render after navigation already has tiles.
		const w = el.getBoundingClientRect().width;
		if (w > 0) setContainerWidth((prev) => (prev === w ? prev : w));
		roRef.current = new ResizeObserver(([entry]) => {
			const { width } = entry.contentRect;
			if (width > 0) setContainerWidth(width);
		});
		roRef.current.observe(el);
	};

	const contentHeight = useMemo(() => {
		if (!containerWidth || !treemapFiles.length) return 400;
		return Math.max(400, Math.ceil((treemapFiles.length * 20000) / containerWidth));
	}, [containerWidth, treemapFiles.length]);

	const { leaves, dirNodes } = useMemo(() => {
		if (!containerWidth || !treemapFiles.length) {
			return { leaves: [], dirNodes: [] };
		}

		const dirs = [...new Set(treemapFiles.map((f) => f.dir))];
		const root = hierarchy<TreeNode>({
			name: "root",
			children: dirs.map((dir) => ({
				name: dir,
				children: treemapFiles.filter((f) => f.dir === dir).map((f) => ({ ...f })),
			})),
		})
			// ponytail: flat count — size encodes file count, color encodes risk; complexity weighting caused 6:1 area ratios that crushed small dirs
			.sum((d) => (d.children ? 0 : 1))
			.sort((a, b) => {
				if (sort === "risk-desc") return (b.data.risk ?? 0) - (a.data.risk ?? 0);
				if (sort === "risk-asc") return (a.data.risk ?? 0) - (b.data.risk ?? 0);
				if (sort === "complexity-desc")
					return (b.data.complexity ?? 0) - (a.data.complexity ?? 0);
				if (sort === "commits-desc") return (b.data.commits ?? 0) - (a.data.commits ?? 0);
				if (sort === "name-asc")
					return (a.data.name ?? "").localeCompare(b.data.name ?? "");
				return 0;
			});

		treemap<TreeNode>()
			.size([containerWidth, contentHeight])
			.paddingOuter(6)
			.paddingTop((n) => (n.depth === 0 ? 6 : DIR_LABEL_HEIGHT))
			.paddingInner(3)
			// ponytail: binary at depth 0 gives dirs a 2D grid placement; squarify within each dir keeps files squarish
			.tile((node, x0, y0, x1, y1) => {
				if (node.depth === 0) treemapBinary(node, x0, y0, x1, y1);
				else treemapSquarify(node, x0, y0, x1, y1);
			})(root);

		return {
			leaves: root.leaves() as HierarchyRectangularNode<TreeNode>[],
			dirNodes: (root.children ?? []) as HierarchyRectangularNode<TreeNode>[],
		};
	}, [containerWidth, contentHeight, treemapFiles, sort]);

	return (
		<TooltipProvider>
			<Tabs
				defaultValue={window.matchMedia("(max-width: 639px)").matches ? "list" : "heatmap"}
				className="border-border bg-card overflow-hidden rounded-xl border"
			>
				<HeatmapToolbar
					filter={activeFilter}
					onFilterChange={handleFilterChange}
					search={search}
					onSearchChange={setSearch}
					sort={sort}
					onSortChange={setSort}
					counts={counts}
				/>

				<TabsContent value="heatmap" className="m-0">
					{visible.length === 0 ? (
						<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
							No files match the current filter.
						</div>
					) : (
						<>
							{isCapped && (
								<div className="text-muted-foreground border-border border-b px-4 py-2 text-sm">
									Showing the {TREEMAP_CAP} riskiest files out of {visible.length}
									. Switch to List to browse all.
								</div>
							)}
							<div
								ref={attachRef}
								className="relative w-full"
								style={{ height: contentHeight }}
							>
								{dirNodes.map((d) => (
									<div
										key={d.data.name}
										className="pointer-events-none absolute px-1"
										style={{
											left: d.x0,
											top: d.y0,
											width: d.x1 - d.x0,
											height: d.y1 - d.y0,
										}}
									>
										<P
											className="text-muted-foreground flex items-center truncate font-mono text-xs"
											style={{ height: DIR_LABEL_HEIGHT }}
										>
											{d.data.name || "./"}
										</P>
									</div>
								))}
								{leaves.map((l) => (
									<Tile
										key={`${l.data.dir}${l.data.name}`}
										node={l}
										onNavigate={(path) =>
											navigate({
												to: "/repositories/$repository/file",
												params: { repository: props.repository },
												search: { path },
											})
										}
									/>
								))}
							</div>
						</>
					)}
				</TabsContent>

				<TabsContent value="list" className="m-0">
					<HeatmapListView files={visible} repository={props.repository} />
				</TabsContent>
			</Tabs>
		</TooltipProvider>
	);
}
