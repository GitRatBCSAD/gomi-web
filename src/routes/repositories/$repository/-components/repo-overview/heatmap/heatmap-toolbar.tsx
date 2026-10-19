import { SearchIcon, XIcon } from "lucide-react";
import type { JSX } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RISK_BANDS, type RiskBand } from "@/lib/interpret";
import { cn } from "@/lib/utils";

import { FILTERS, type FilterKey, type SortOption } from "./heatmap-utils";

const LEGEND: RiskBand[] = ["low", "moderate", "high", "very-high", "insufficient"];

export function HeatmapToolbar(props: {
	filter: FilterKey;
	onFilterChange: (f: FilterKey) => void;
	search: string;
	onSearchChange: (s: string) => void;
	sort: SortOption;
	onSortChange: (s: SortOption) => void;
	counts: Record<FilterKey, number>;
}): JSX.Element {
	const { filter, onFilterChange, search, onSearchChange, sort, onSortChange } = props;

	return (
		<div className="border-border space-y-3 border-b px-4 py-3">
			<div className="flex flex-wrap items-center gap-2">
				<Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterKey)}>
					<TabsList>
						{FILTERS.map(({ key, label }) => (
							<TabsTrigger key={key} value={key}>
								{label}
								<span className="text-muted-foreground font-mono text-xs tabular-nums">
									{props.counts[key]}
								</span>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<div className="relative min-w-48 flex-1">
					<SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
					<Input
						placeholder="Search by file or folder"
						aria-label="Search files"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-8 pr-7 pl-8 text-sm"
					/>
					{search && (
						<button
							type="button"
							aria-label="Clear search"
							onClick={() => onSearchChange("")}
							className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
						>
							<XIcon className="size-3.5" />
						</button>
					)}
				</div>

				<select
					value={sort}
					aria-label="Sort files"
					onChange={(e) => onSortChange(e.target.value as SortOption)}
					className="border-input bg-background text-foreground focus-visible:ring-ring h-8 rounded-md border px-2.5 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
				>
					<option value="risk-desc">Riskiest first</option>
					<option value="risk-asc">Safest first</option>
					<option value="complexity-desc">Most complex first</option>
					<option value="commits-desc">Most changed first</option>
					<option value="name-asc">Name (A–Z)</option>
				</select>

				<TabsList>
					<TabsTrigger value="heatmap">Map</TabsTrigger>
					<TabsTrigger value="list">List</TabsTrigger>
				</TabsList>
			</div>

			<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
				<span className="text-foreground font-medium">Risk</span>
				{LEGEND.map((b) => (
					<span key={b} className="flex items-center gap-1.5">
						<span
							className={cn(
								"border-border size-3 rounded-[2px] border",
								b === "insufficient" && "bg-hatch",
							)}
							style={
								b === "insufficient"
									? undefined
									: { backgroundColor: RISK_BANDS[b].fill }
							}
						/>
						{RISK_BANDS[b].label}
					</span>
				))}
				<span className="sm:ml-auto">
					High and Very High are above the model's warning line.
				</span>
			</div>
		</div>
	);
}
