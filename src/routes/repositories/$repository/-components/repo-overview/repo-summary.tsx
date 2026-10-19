import type { JSX } from "react";

import { P } from "@/components/typography";
import type { FileRiskResult } from "@/lib/github/model";
import { RISK_BANDS, riskBand, type RiskBand, type RiskScale } from "@/lib/interpret";
import { cn } from "@/lib/utils";

import { categoryOf, type FilterKey } from "./heatmap/heatmap-utils";

const ORDER: RiskBand[] = ["very-high", "high", "moderate", "low", "insufficient"];

function headline(total: number, risky: number, veryHigh: number, lowConf: number): string {
	if (total === 0) return "No files were analyzed.";
	const scored = total - lowConf;
	if (scored === 0)
		return "None of the files have enough recent history to judge yet. Try again after more changes land.";
	if (risky === 0)
		return `Good news: none of the ${scored.toLocaleString()} scored files are above the warning line.`;
	const share = Math.round((risky / scored) * 100);
	const vh = veryHigh > 0 ? `, ${veryHigh.toLocaleString()} of them Very High` : "";
	const next = veryHigh > 0 ? "Start with the Very High files." : "Start with the High files.";
	return `${risky.toLocaleString()} of ${scored.toLocaleString()} scored files (${share}%) need attention${vh}. ${next}`;
}

export function RepoSummary(props: {
	fileResults: FileRiskResult[];
	scale: RiskScale;
	selectedFilter: FilterKey;
	onSelectFilter: (filter: FilterKey) => void;
}): JSX.Element {
	const { fileResults, scale, selectedFilter, onSelectFilter } = props;

	const byBand: Record<RiskBand, number> = {
		"very-high": 0,
		high: 0,
		moderate: 0,
		low: 0,
		insufficient: 0,
	};
	for (const f of fileResults) byBand[riskBand(f.riskScore, f.lowConfidence, scale)]++;
	const bands = ORDER.filter((b) => byBand[b] > 0);
	const toggle = (b: RiskBand) => {
		const cat = categoryOf(b);
		onSelectFilter(selectedFilter === cat ? "all" : cat);
	};
	const dimmed = (b: RiskBand) => selectedFilter !== "all" && categoryOf(b) !== selectedFilter;

	return (
		<section className="space-y-3">
			<P className="text-foreground max-w-4xl text-xl leading-snug font-medium text-balance">
				{headline(
					fileResults.length,
					byBand["very-high"] + byBand.high,
					byBand["very-high"],
					byBand.insufficient,
				)}
			</P>

			<div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
				{bands.map((b) => (
					<button
						key={b}
						type="button"
						aria-label={`Show ${RISK_BANDS[b].label} files`}
						onClick={() => toggle(b)}
						className={cn(
							"h-full cursor-pointer transition-opacity hover:opacity-80",
							b === "insufficient" && "bg-hatch",
							dimmed(b) && "opacity-25",
						)}
						style={{
							flex: byBand[b],
							backgroundColor: b === "insufficient" ? undefined : RISK_BANDS[b].fill,
						}}
					/>
				))}
			</div>

			<ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
				{bands.map((b) => (
					<li key={b}>
						<button
							type="button"
							onClick={() => toggle(b)}
							className={cn(
								"text-muted-foreground hover:text-foreground flex cursor-pointer items-baseline gap-1.5 transition-colors",
								dimmed(b) && "opacity-50",
							)}
						>
							<span
								className="text-foreground font-mono font-medium tabular-nums"
								style={
									b === "insufficient" ? undefined : { color: RISK_BANDS[b].fg }
								}
							>
								{byBand[b]}
							</span>
							{b === "insufficient"
								? RISK_BANDS[b].label
								: `${RISK_BANDS[b].label} risk`}
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}
