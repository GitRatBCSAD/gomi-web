import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { useMemo, useRef, useState, type JSX } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { FileRiskResult } from "@/lib/github/model";

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

export { riskColor } from "./heatmap-utils";

export function Heatmap(props: {
	fileResults: FileRiskResult[];
	threshold: number;
	repository: string;
	filter?: FilterKey;
	onFilterChange?: (filter: FilterKey) => void;
}): JSX.Element {
	const [internalFilter, setInternalFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOption>("risk-desc");

	const activeFilter = props.filter ?? internalFilter;
	const handleFilterChange = (f: FilterKey) => {
		setInternalFilter(f);
		props.onFilterChange?.(f);
	};

	const data = props.fileResults.map(toFileInfo);

	const counts: Record<FilterKey, number> = {
		all: data.length,
		risky: data.filter((f) => getCategory(f, props.threshold) === "risky").length,
		acceptable: data.filter((f) => getCategory(f, props.threshold) === "acceptable").length,
		"low-conf": data.filter((f) => getCategory(f, props.threshold) === "low-conf").length,
	};

	const visible = data
		.filter((f) => {
			if (activeFilter !== "all" && getCategory(f, props.threshold) !== activeFilter) return false;
			if (search) {
				const fullPath = `${f.dir}${f.name}`.toLowerCase();
				if (!fullPath.includes(search.toLowerCase())) return false;
			}
			return true;
		})
		.sort((a, b) => {
			if (sort === "risk-desc") return (b.risk ?? 0) - (a.risk ?? 0);
			if (sort === "risk-asc") return (a.risk ?? 0) - (b.risk ?? 0);
			if (sort === "complexity-desc") return (b.complexity ?? 0) - (a.complexity ?? 0);
			if (sort === "commits-desc") return (b.commits ?? 0) - (a.commits ?? 0);
			if (sort === "name-asc") return (a.name ?? "").localeCompare(b.name ?? "");
			return 0;
		});

	const [containerWidth, setContainerWidth] = useState(0);
	const roRef = useRef<ResizeObserver | null>(null);

	const attachRef = (el: HTMLDivElement | null) => {
		roRef.current?.disconnect();
		if (!el) return;
		roRef.current = new ResizeObserver(([entry]) => {
			const { width } = entry.contentRect;
			if (width > 0) setContainerWidth(width);
		});
		roRef.current.observe(el);
	};

	const contentHeight = useMemo(() => {
		if (!containerWidth || !visible.length) return 400;
		return Math.max(400, Math.ceil((visible.length * 15000) / containerWidth));
	}, [containerWidth, visible.length]);

	const { leaves, dirNodes } = useMemo(() => {
		if (!containerWidth || !visible.length) {
			return { leaves: [], dirNodes: [] };
		}

		const dirs = [...new Set(visible.map((f) => f.dir))];
		const root = hierarchy<TreeNode>({
			name: "root",
			children: dirs.map((dir) => ({
				name: dir,
				children: visible.filter((f) => f.dir === dir).map((f) => ({ ...f })),
			})),
		})
			.sum((d) => Math.max(d.complexity ?? 0, 0.1))
			.sort((a, b) => {
				if (sort === "risk-desc") return (b.data.risk ?? 0) - (a.data.risk ?? 0);
				if (sort === "risk-asc") return (a.data.risk ?? 0) - (b.data.risk ?? 0);
				if (sort === "complexity-desc") return (b.data.complexity ?? 0) - (a.data.complexity ?? 0);
				if (sort === "commits-desc") return (b.data.commits ?? 0) - (a.data.commits ?? 0);
				if (sort === "name-asc") return (a.data.name ?? "").localeCompare(b.data.name ?? "");
				return 0;
			});

		treemap<TreeNode>()
			.size([containerWidth, contentHeight])
			.paddingOuter(4)
			.paddingTop(DIR_LABEL_HEIGHT)
			.paddingInner(1)
			.tile(treemapSquarify)(root);

		return {
			leaves: root.leaves() as HierarchyRectangularNode<TreeNode>[],
			dirNodes: (root.children ?? []) as HierarchyRectangularNode<TreeNode>[],
		};
	}, [containerWidth, contentHeight, visible, sort]);

	return (
		<TooltipProvider>
			<Tabs
				defaultValue="heatmap"
				className="border-border font-fira-mono bg-card overflow-hidden rounded-xl border"
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
						<div
							ref={attachRef}
							className="relative w-full"
							style={{ height: contentHeight }}
						>
							{dirNodes.map((d) => (
								<div
									key={d.data.name}
									className="pointer-events-none absolute flex items-center px-1.5"
									style={{
										left: d.x0,
										top: d.y0,
										width: d.x1 - d.x0,
										height: DIR_LABEL_HEIGHT,
									}}
								>
									<p className="font-fira-mono text-muted-foreground/70 truncate text-xs">
										{d.data.name}
									</p>
								</div>
							))}
							{leaves.map((l) => (
								<Tile
									key={`${l.data.dir}${l.data.name}`}
									node={l}
									threshold={props.threshold}
									repository={props.repository}
								/>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="list" className="m-0">
					<HeatmapListView
						files={visible}
						threshold={props.threshold}
						repository={props.repository}
					/>
				</TabsContent>
			</Tabs>
		</TooltipProvider>
	);
}
