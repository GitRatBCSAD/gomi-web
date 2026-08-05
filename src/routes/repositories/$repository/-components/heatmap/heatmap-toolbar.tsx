import { Grid2X2Icon, ListIcon, XIcon } from "lucide-react";
import type { JSX } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	DOT_COLOR,
	FILTERS,
	LEGEND_GRADIENT,
	HATCH,
	type FilterKey,
	type RiskCategory,
} from "./heatmap-utils";

export function HeatmapToolbar(props: {
	filter: FilterKey;
	onFilterChange: (f: FilterKey) => void;
	search: string;
	onSearchChange: (s: string) => void;
	counts: Record<FilterKey, number>;
}): JSX.Element {
	const { filter, onFilterChange, search, onSearchChange, counts } = props;

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

				<div className="relative">
					<Input
						placeholder="Filter files..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-8 w-44 text-xs pr-6"
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
		</>
	);
}
