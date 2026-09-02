import { Grid2X2Icon, ListIcon, XIcon } from "lucide-react";
import type { JSX } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/lib/theme";

import {
	DOT_COLOR,
	FILTERS,
	legendGradient,
	HATCH,
	type FilterKey,
	type RiskCategory,
	type SortOption,
} from "./heatmap-utils";

export function HeatmapToolbar(props: {
	filter: FilterKey;
	onFilterChange: (f: FilterKey) => void;
	search: string;
	onSearchChange: (s: string) => void;
	sort: SortOption;
	onSortChange: (s: SortOption) => void;
	counts: Record<FilterKey, number>;
}): JSX.Element {
	const { filter, onFilterChange, search, onSearchChange, sort, onSortChange, counts } = props;
	const { theme } = useTheme();

	return (
		<>
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
								<span className="text-muted-foreground tabular-nums">
									{counts[key].toLocaleString()}
								</span>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<div className="flex-1" />

				<select
					value={sort}
					onChange={(e) => onSortChange(e.target.value as SortOption)}
					className="border-input bg-background font-fira-mono text-muted-foreground focus-visible:ring-ring hover:text-foreground h-8 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
							className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
						>
							<XIcon className="size-3" />
						</button>
					)}
				</div>
			</div>

			<div className="border-border flex flex-wrap items-center gap-4 border-b px-4 py-2.5">
				<div className="flex shrink-0 items-center gap-2">
					<span className="text-muted-foreground text-xs">Low</span>
					<div
						className="h-2.5 w-20 rounded-sm"
						style={{ background: legendGradient(theme) }}
					/>
					<span className="text-muted-foreground text-xs">High</span>
					<div className="ml-2 flex items-center gap-1.5">
						<div
							className="border-border/30 h-2.5 w-6 rounded-sm border"
							style={{ backgroundImage: HATCH, backgroundColor: "var(--muted)" }}
						/>
						<span className="text-muted-foreground text-xs">Low Conf</span>
					</div>
				</div>
			</div>
		</>
	);
}
