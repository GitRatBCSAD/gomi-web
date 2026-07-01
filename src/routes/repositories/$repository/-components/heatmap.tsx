import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { Grid2X2Icon, ListIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { JSX } from "react";

import { P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FileRiskResult } from "@/lib/github/model";

type RiskCategory = "risky" | "acceptable" | "low-conf";
type FilterKey = "all" | RiskCategory;

type FileInfo = {
	name: string;
	dir: string;
	risk: number;
	complexity: number;
	commits: number;
	lowConf: boolean;
};

type TreeNode = {
	name: string;
	risk?: number;
	complexity?: number;
	commits?: number;
	lowConf?: boolean;
	dir?: string;
	children?: TreeNode[];
};

function toFileInfo(r: FileRiskResult): FileInfo {
	const parts = r.filename.split("/");
	const name = parts.pop() ?? r.filename;
	const dir = parts.length > 0 ? parts.join("/") + "/" : "";
	return {
		name,
		dir,
		risk: r.riskScore,
		complexity: r.complexityScore,
		commits: r.commitSentiments.length,
		lowConf: r.lowConfidence,
	};
}

const HATCH =
	"repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)";
const LEGEND_GRADIENT =
	"linear-gradient(to right, #204426 0%, #3a5f2d 30%, #8a7435 55%, #af5a3f 75%, #c04838 100%)";

const DOT_COLOR: Record<RiskCategory, string> = {
	risky: "var(--destructive)",
	acceptable: "var(--primary)",
	"low-conf": "var(--muted-foreground)",
};

const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "risky", label: "Risky" },
	{ key: "acceptable", label: "Acceptable" },
	{ key: "low-conf", label: "Low conf" },
];

const DIR_LABEL_HEIGHT = 20;

export function Heatmap(props: { fileResults: FileRiskResult[]; threshold: number }): JSX.Element {
	const [filter, setFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");

	const data = props.fileResults.map(toFileInfo);

	const counts: Record<FilterKey, number> = {
		all: data.length,
		risky: data.filter((f) => getCategory(f, props.threshold) === "risky").length,
		acceptable: data.filter((f) => getCategory(f, props.threshold) === "acceptable").length,
		"low-conf": data.filter((f) => getCategory(f, props.threshold) === "low-conf").length,
	};

	const visible = data.filter((f) => {
		if (filter !== "all" && getCategory(f, props.threshold) !== filter) return false;
		if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
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

	// ~15000px² per tile (≈150×100px) so files extend downward instead of squeezing into columns
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
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

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
	}, [containerWidth, contentHeight, visible]);

	return (
		<TooltipProvider>
			<Tabs
				defaultValue="heatmap"
				className="border-border font-fira-mono bg-card overflow-hidden rounded-xl border"
			>
				{/* Toolbar */}
				<div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-3">
					{/* Category filter — nested Tabs, layout only, no content panels */}
					<Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
						<TabsList>
							{FILTERS.map(({ key, label }) => (
								<TabsTrigger key={key} value={key} className="gap-1.5">
									{key !== "all" && (
										<span
											className="size-1.5 shrink-0 rounded-full"
											style={{
												backgroundColor: DOT_COLOR[key as RiskCategory],
											}}
										/>
									)}
									{label}
									<span className="text-muted-foreground tabular-nums">
										{counts[key]}
									</span>
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>

					<div className="flex-1" />

					<TabsList>
						<TabsTrigger value="heatmap">
							<Grid2X2Icon data-icon="inline-start" />
							Heatmap
						</TabsTrigger>
						<TabsTrigger value="list">
							<ListIcon data-icon="inline-start" />
							List
						</TabsTrigger>
					</TabsList>

					<Input
						placeholder="Filter files..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-8 w-44 text-xs"
					/>
				</div>

				<div className="border-border flex flex-wrap items-center gap-4 border-b px-4 py-2.5">
					<div className="flex shrink-0 items-center gap-2">
						<span className="text-muted-foreground text-xs">Low</span>
						<div
							className="h-2.5 w-20 rounded-sm"
							style={{ background: LEGEND_GRADIENT }}
						/>
						<span className="text-muted-foreground text-xs">High</span>
						<div className="ml-2 flex items-center gap-1.5">
							<div
								className="border-border/30 h-2.5 w-6 rounded-sm border"
								style={{ backgroundImage: HATCH, backgroundColor: "#303338" }}
							/>
							<span className="text-muted-foreground text-xs">Low Conf</span>
						</div>
					</div>
				</div>

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
								/>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="list" className="m-0">
					<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
						TODO
					</div>
				</TabsContent>
			</Tabs>
		</TooltipProvider>
	);
}

function Tile(props: { node: HierarchyRectangularNode<TreeNode>; threshold: number }): JSX.Element {
	const w = props.node.x1 - props.node.x0;
	const h = props.node.y1 - props.node.y0;
	const risk = props.node.data.risk ?? 0;
	const complexity = props.node.data.complexity ?? 0;
	const commits = props.node.data.commits ?? 0;
	const lowConf = props.node.data.lowConf ?? false;
	const name = props.node.data.name ?? "";
	const dir = props.node.data.dir ?? "";
	const cat: RiskCategory = lowConf
		? "low-conf"
		: risk >= props.threshold
			? "risky"
			: "acceptable";
	const tooSmall = w < 52 || h < 34;

	return (
		<Tooltip>
			<TooltipTrigger
				className="border-dark-500 absolute cursor-pointer overflow-hidden border text-left hover:outline focus-visible:outline"
				style={{
					left: props.node.x0,
					top: props.node.y0,
					width: w,
					height: h,
					backgroundColor: riskColor(risk),
				}}
			>
				{lowConf && (
					<div
						className="pointer-events-none absolute inset-0"
						style={{ backgroundImage: HATCH }}
					/>
				)}
				{!tooSmall && (
					<div className="pointer-events-none absolute right-1.5 bottom-1.5 left-1.5">
						<p className="font-fira-mono truncate text-xs leading-tight text-white/90">
							{name}
						</p>
						{lowConf ? (
							<p className="font-fira-mono text-xs tracking-wider text-white/50 uppercase">
								Low Conf
							</p>
						) : (
							<p className="font-fira-mono text-xs text-white/60">
								{risk.toFixed(2)}
							</p>
						)}
					</div>
				)}
			</TooltipTrigger>

			<TooltipContent
				side="bottom"
				align="center"
				className="bg-muted flex max-w-fit flex-col border"
			>
				<div>
					<P>{name}</P>
					<p className="font-fira-mono text-muted-foreground text-xs">{dir}</p>
				</div>

				<div className="flex w-full justify-between">
					<Badge>{cat === "low-conf" ? "Low Conf" : cat}</Badge>
					<P>{risk.toFixed(2)}</P>
				</div>

				<div className="font-fira-mono space-y-1 text-xs">
					<div className="flex justify-between gap-4">
						<P>complexity</P>
						<P>{complexity.toFixed(2)}</P>
					</div>

					<div className="flex justify-between gap-4">
						<P>commits</P>
						<P>{commits}</P>
					</div>
				</div>

				<div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
					<div
						className="absolute inset-0"
						style={{
							background: LEGEND_GRADIENT,
							clipPath: `inset(0 ${(1 - risk) * 100}% 0 0 round 999px)`,
						}}
					/>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

function getCategory(f: FileInfo, threshold: number): RiskCategory {
	if (f.lowConf) return "low-conf";
	return f.risk >= threshold ? "risky" : "acceptable";
}

function riskColor(risk: number): string {
	const stops: [number, [number, number, number]][] = [
		[0.0, [32, 68, 38]],
		[0.3, [58, 82, 42]],
		[0.5, [92, 95, 45]],
		[0.65, [120, 100, 50]],
		[0.8, [175, 90, 72]],
		[1.0, [195, 80, 62]],
	];
	let lo = stops[0],
		hi = stops[stops.length - 1];
	for (let i = 0; i < stops.length - 1; i++) {
		if (risk >= stops[i][0] && risk <= stops[i + 1][0]) {
			lo = stops[i];
			hi = stops[i + 1];
			break;
		}
	}
	const t = lo[0] === hi[0] ? 0 : (risk - lo[0]) / (hi[0] - lo[0]);
	const [r, g, b] = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * t));
	return `rgb(${r},${g},${b})`;
}
