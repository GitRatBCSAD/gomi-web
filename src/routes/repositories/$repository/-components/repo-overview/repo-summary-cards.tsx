import type { JSX } from "react";

import { H2, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import { BELOW_GATE, RISK_BANDS, riskBand, type RiskBand, type RiskScale } from "@/lib/interpret";

import { categoryOf, type FilterKey } from "./heatmap/heatmap-utils";

function headline(total: number, risky: number, veryHigh: number, lowConf: number): string {
	if (total === 0) return "No files were analyzed.";
	const scored = total - lowConf;
	if (scored === 0)
		return "None of the files have enough recent history to judge yet. Try again after more changes land.";
	if (risky === 0)
		return `Good news: none of the ${scored.toLocaleString()} scored files are above the warning line.`;
	const share = Math.round((risky / scored) * 100);
	const vh = veryHigh > 0 ? `, ${veryHigh.toLocaleString()} of them Very High` : "";
	return `${risky.toLocaleString()} of ${scored.toLocaleString()} scored files (${share}%) need attention${vh}. Start with the red tiles.`;
}

export function RepoSummaryCards(props: {
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
	const count = (cat: FilterKey) =>
		(Object.keys(byBand) as RiskBand[])
			.filter((b) => cat === "all" || categoryOf(b) === cat)
			.reduce((s, b) => s + byBand[b], 0);

	const cards: {
		key: FilterKey;
		title: string;
		caption: string;
		color: string;
		border: string;
	}[] = [
		{
			key: "all",
			title: "Files analyzed",
			caption: "Files changed in the last 6 months",
			color: "text-primary",
			border: "border-primary",
		},
		{
			key: "risky",
			title: "Needs attention",
			caption: `${byBand["very-high"]} Very High · ${byBand.high} High risk`,
			color: "text-destructive",
			border: "border-destructive",
		},
		{
			key: "acceptable",
			title: "OK for now",
			caption: `${byBand.moderate} Moderate · ${byBand.low} Low risk`,
			color: "text-success-500",
			border: "border-primary",
		},
		{
			key: "low-conf",
			title: RISK_BANDS.insufficient.label,
			caption: `Not scored: ${BELOW_GATE} in 6 months`,
			color: "text-muted-foreground",
			border: "border-muted-foreground",
		},
	];

	return (
		<section className="space-y-2">
			<P className="text-foreground px-1 text-base">
				{headline(
					fileResults.length,
					count("risky"),
					byBand["very-high"],
					byBand.insufficient,
				)}
			</P>
			<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
				{cards.map((c) => (
					<Card
						key={c.key}
						role="button"
						tabIndex={0}
						aria-pressed={selectedFilter === c.key}
						className={`cursor-pointer transition-all ${selectedFilter === c.key ? c.border : "opacity-85"}`}
						onClick={() => onSelectFilter(c.key)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") onSelectFilter(c.key);
						}}
					>
						<CardHeader>
							<H2 variant="p">{c.title}</H2>
						</CardHeader>
						<CardContent className="flex flex-col gap-1">
							<P variant="h2" className={c.color}>
								{count(c.key).toLocaleString()}
							</P>
							<P className="text-muted-foreground text-xs">{c.caption}</P>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}
