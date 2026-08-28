import { Grid2X2Icon, ListIcon, XIcon } from "lucide-react";
import type { JSX } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	DOT_COLOR,
	FILTERS,
	HATCH,
	LEGEND_GRADIENT,
	type FilterKey,
	type RiskCategory,
	type SortOption,
} from "./heatmap-utils";

const RISK_SCALE_MARKS = [
	{ value: 0.0, label: "0.0" },
	{ value: 0.3, label: "0.3" },
	{ value: 0.5, label: "0.5" },
	{ value: 0.65, label: "0.65" },
	{ value: 0.8, label: "0.8" },
	{ value: 1.0, label: "1.0" },
];

export function HeatmapToolbar(props: {
	filter: FilterKey;
	onFilterChange: (f: FilterKey) => void;
	search: string;
	onSearchChange: (s: string) => void;
	sort: SortOption;
	onSortChange: (s: SortOption) => void;
	counts: Record<FilterKey, number>;
	threshold: number;
}): JSX.Element {
	const { filter, onFilterChange, search, onSearchChange, sort, onSortChange, counts, threshold } =
		props;

	return (
		<>
			{/* ── Row 1: filter tabs / sort / view toggle / search ── */}
			<div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-3">
				<Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterKey)}>
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
								<span className="text-muted-foreground tabular-nums">{counts[key]}</span>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<div className="flex-1" />

				<select
					value={sort}
					onChange={(e) => onSortChange(e.target.value as SortOption)}
					className="border-input bg-background font-fira-mono text-muted-foreground focus-visible:ring-ring h-8 rounded-md border px-2.5 text-xs font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1"
				>
					<option value="risk-desc">Sort: Highest Risk</option>
					<option value="risk-asc">Sort: Lowest Risk</option>
					<option value="complexity-desc">Sort: Highest Complexity</option>
					<option value="commits-desc">Sort: Most Commits</option>
					<option value="name-asc">Sort: Name (A-Z)</option>
				</select>

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

				<div className="relative">
					<Input
						placeholder="Filter files..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-8 w-44 pr-6 text-xs"
					/>
					{search && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
						>
							<XIcon className="size-3" />
						</button>
					)}
				</div>
			</div>

			{/* ── Row 2: persistent legend panel ── */}
			<div className="border-border flex flex-wrap items-start gap-x-6 gap-y-3 border-b px-4 py-3">
				{/* Risk color scale */}
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground font-fira-mono text-[10px] uppercase tracking-wider">
						Risk Score
					</span>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs">Low</span>
						<div className="relative h-2.5 w-32 rounded-sm" style={{ background: LEGEND_GRADIENT }}>
							{RISK_SCALE_MARKS.map(({ value, label }) => (
								<div
									key={label}
									className="absolute -bottom-4 flex -translate-x-1/2 flex-col items-center"
									style={{ left: `${value * 100}%` }}
								>
									<div className="bg-muted-foreground/40 h-1 w-px" />
									<span className="text-muted-foreground font-fira-mono text-[9px]">{label}</span>
								</div>
							))}
						</div>
						<span className="text-muted-foreground text-xs">High</span>
					</div>
					{/* spacer for the tick labels below the bar */}
					<div className="h-4" />
				</div>

				{/* Risky / Acceptable classification */}
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground font-fira-mono text-[10px] uppercase tracking-wider">
						Classification
					</span>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1.5">
							<span
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: DOT_COLOR.risky }}
							/>
							<span className="text-foreground/80 font-fira-mono text-xs">
								Risky
							</span>
							<span className="text-muted-foreground font-fira-mono text-xs">
								— risk score ≥ {threshold.toFixed(2)}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: DOT_COLOR.acceptable }}
							/>
							<span className="text-foreground/80 font-fira-mono text-xs">
								Acceptable
							</span>
							<span className="text-muted-foreground font-fira-mono text-xs">
								— risk score &lt; {threshold.toFixed(2)}
							</span>
						</div>
					</div>
				</div>

				{/* Low Confidence flag */}
				<div className="flex flex-col gap-1">
					<span className="text-muted-foreground font-fira-mono text-[10px] uppercase tracking-wider">
						Flags
					</span>
					<div className="flex items-start gap-2">
						<div
							className="border-border/30 mt-0.5 h-3.5 w-6 shrink-0 rounded-sm border"
							style={{ backgroundImage: HATCH, backgroundColor: "#303338" }}
						/>
						<div className="flex flex-col">
							<span className="text-foreground/80 font-fira-mono text-xs">Low Confidence</span>
							<span className="text-muted-foreground font-fira-mono text-[10px] leading-tight">
								Too few commits for a reliable risk prediction.
								<br />
								Score excluded from Risky / Acceptable counts.
							</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
