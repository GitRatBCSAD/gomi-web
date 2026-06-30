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

const DATA: FileInfo[] = [
	{
		name: "transaction.py",
		dir: "src/core/",
		risk: 0.81,
		complexity: 0.72,
		commits: 14,
		lowConf: false,
	},
	{
		name: "fraud_detector.py",
		dir: "src/core/",
		risk: 0.67,
		complexity: 0.55,
		commits: 9,
		lowConf: false,
	},
	{
		name: "payment_processor.py",
		dir: "src/core/",
		risk: 0.76,
		complexity: 0.68,
		commits: 12,
		lowConf: false,
	},
	{
		name: "dispute_handler.py",
		dir: "src/core/",
		risk: 0.45,
		complexity: 0.3,
		commits: 7,
		lowConf: true,
	},
	{
		name: "invoice_generator.py",
		dir: "src/services/",
		risk: 0.4,
		complexity: 0.52,
		commits: 18,
		lowConf: false,
	},
	{
		name: "refund_service.py",
		dir: "src/services/",
		risk: 0.41,
		complexity: 0.38,
		commits: 11,
		lowConf: true,
	},
	{
		name: "rate_limiter.py",
		dir: "src/services/",
		risk: 0.35,
		complexity: 0.42,
		commits: 8,
		lowConf: true,
	},
	{
		name: "notification_service.py",
		dir: "src/services/",
		risk: 0.41,
		complexity: 0.45,
		commits: 6,
		lowConf: false,
	},
	{
		name: "validators.py",
		dir: "src/utils/",
		risk: 0.19,
		complexity: 0.25,
		commits: 5,
		lowConf: false,
	},
	{
		name: "helpers.py",
		dir: "src/utils/",
		risk: 0.22,
		complexity: 0.2,
		commits: 4,
		lowConf: false,
	},
	{
		name: "audit_logger.py",
		dir: "src/utils/",
		risk: 0.38,
		complexity: 0.32,
		commits: 9,
		lowConf: false,
	},
	{
		name: "currency_converter.py",
		dir: "src/utils/",
		risk: 0.25,
		complexity: 0.28,
		commits: 6,
		lowConf: true,
	},
	{
		name: "retry_logic.py",
		dir: "src/utils/",
		risk: 0.38,
		complexity: 0.22,
		commits: 5,
		lowConf: true,
	},
	{ name: "models.py", dir: "src/", risk: 0.28, complexity: 0.4, commits: 12, lowConf: false },
	{
		name: "serializers.py",
		dir: "src/",
		risk: 0.17,
		complexity: 0.35,
		commits: 8,
		lowConf: false,
	},
	{ name: "config.py", dir: "src/", risk: 0.14, complexity: 0.18, commits: 5, lowConf: false },
	{ name: "constants.py", dir: "src/", risk: 0.08, complexity: 0.12, commits: 3, lowConf: false },
	{
		name: "auth_middleware.py",
		dir: "src/middleware/",
		risk: 0.35,
		complexity: 0.38,
		commits: 7,
		lowConf: true,
	},
	{
		name: "session_manager.py",
		dir: "src/middleware/",
		risk: 0.45,
		complexity: 0.25,
		commits: 4,
		lowConf: true,
	},
	{
		name: "webhook_handler.py",
		dir: "src/api/",
		risk: 0.71,
		complexity: 0.6,
		commits: 15,
		lowConf: false,
	},
];

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

export function Heatmap(): JSX.Element {
	const [filter, setFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");

	const counts: Record<FilterKey, number> = {
		all: DATA.length,
		risky: DATA.filter((f) => getCategory(f) === "risky").length,
		acceptable: DATA.filter((f) => getCategory(f) === "acceptable").length,
		"low-conf": DATA.filter((f) => getCategory(f) === "low-conf").length,
	};

	const visible = DATA.filter((f) => {
		if (filter !== "all" && getCategory(f) !== filter) return false;
		if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	});

	const [dims, setDims] = useState({ width: 0, height: 0 });

	// Callback ref: re-attaches ResizeObserver if the panel remounts.
	// Skips zero-size entries (fired when panel is hidden via display:none).
	const roRef = useRef<ResizeObserver | null>(null);
	const attachRef = (el: HTMLDivElement | null) => {
		roRef.current?.disconnect();
		if (!el) return;
		roRef.current = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			if (width > 0 && height > 0) setDims({ width, height });
		});
		roRef.current.observe(el);
	};

	const { leaves, dirNodes } = useMemo(() => {
		if (!dims.width || !dims.height || !visible.length) {
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
			.sum((d) => d.complexity ?? 0)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		treemap<TreeNode>()
			.size([dims.width, dims.height])
			.paddingOuter(4)
			.paddingTop(DIR_LABEL_HEIGHT)
			.paddingInner(1)
			.tile(treemapSquarify)(root);

		return {
			leaves: root.leaves() as HierarchyRectangularNode<TreeNode>[],
			dirNodes: (root.children ?? []) as HierarchyRectangularNode<TreeNode>[],
		};
	}, [dims, visible]);

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
						<div ref={attachRef} className="relative h-72 w-full sm:h-96 md:h-130">
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
								<Tile key={`${l.data.dir}${l.data.name}`} node={l} />
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

function Tile({ node }: { node: HierarchyRectangularNode<TreeNode> }): JSX.Element {
	const {
		risk = 0,
		complexity = 0,
		commits = 0,
		lowConf = false,
		name = "",
		dir = "",
	} = node.data;
	const w = node.x1 - node.x0;
	const h = node.y1 - node.y0;
	const cat: RiskCategory = lowConf ? "low-conf" : risk >= 0.65 ? "risky" : "acceptable";
	const tooSmall = w < 52 || h < 34;

	return (
		<Tooltip>
			<TooltipTrigger
				className="absolute cursor-pointer overflow-hidden border border-dark-500 text-left hover:outline focus-visible:outline"
				style={{
					left: node.x0,
					top: node.y0,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategory(f: FileInfo): RiskCategory {
	if (f.lowConf) return "low-conf";
	return f.risk >= 0.65 ? "risky" : "acceptable";
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
