import { SearchIcon, XIcon } from "lucide-react";
import type { JSX } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DOT_COLOR, FILTERS, type FilterKey, type RiskCategory, type SortOption } from "./heatmap-utils";

const LEGEND_ITEMS: { key: RiskCategory; label: string }[] = [
	{ key: "acceptable", label: "Acceptable (< threshold)" },
	{ key: "risky", label: "Risky (≥ threshold)" },
	{ key: "low-conf", label: "Low Confidence (< 10 commits)" },
];

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
		<>
			<div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-3">
				<Tabs value={filter} onValueChange={(v) => onFilterChange(v as FilterKey)}>
					<TabsList>
						{FILTERS.map(({ key, label }) => (
							<TabsTrigger key={key} value={key}>
								{label}
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
					<TabsTrigger value="heatmap">Heatmap</TabsTrigger>
					<TabsTrigger value="list">List</TabsTrigger>
				</TabsList>
			</div>

			<div className="border-border flex flex-wrap items-center gap-4 border-b px-4 py-2.5 justify-between">
				<div className="relative max-w-md flex-1">
					<SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
					<Input
						placeholder="Search Files"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-8 pr-6 pl-8 text-xs"
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

				<div className="flex shrink-0 flex-wrap items-center gap-4">
					{LEGEND_ITEMS.map(({ key, label }) => (
						<div key={key} className="flex items-center gap-1.5">
							{key === "low-conf" ? (
								<span
									className="size-2.5 shrink-0 rounded-full border"
									style={{ borderColor: DOT_COLOR[key] }}
								/>
							) : (
								<span
									className="size-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: DOT_COLOR[key] }}
								/>
							)}
							<span className="text-foreground text-xs">{label}</span>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
