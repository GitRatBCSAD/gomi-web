import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

import { computeDrift } from "./drift-utils";

export function RiskDriftCard({
	file,
	id,
}: {
	file: FileRiskResult;
	id?: string;
}): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const drift = computeDrift(file.commitSentiments, file.shapBreakdown);
	if (!drift) return null;

	// Display-only stats (earlierAvg, laterAvg, pctChange) — separate from categorization
	const sorted = [...file.commitSentiments]
		.filter((c) => c.riskProbability != null)
		.sort((a, b) => a.committedAt - b.committedAt);

	const mid = Math.floor(sorted.length / 2);
	const earlierAvg =
		sorted.slice(0, mid).reduce((acc, c) => acc + (c.riskProbability ?? 0), 0) / mid;
	const laterAvg =
		sorted.slice(mid).reduce((acc, c) => acc + (c.riskProbability ?? 0), 0) /
		(sorted.length - mid);
	const diff = laterAvg - earlierAvg;
	const pctChange = earlierAvg > 0 ? Math.round((diff / earlierAvg) * 100) : 0;
	const isUpward = diff > 0;
	const signStr = isUpward ? "+" : "";

	// Badge color keyed to spike direction, not raw diff threshold
	let categoryBg: string;
	let categoryFg: string;
	if (drift.hasSpike && drift.spikeDirection === "up") {
		categoryBg = "var(--destructive-900)";
		categoryFg = "var(--destructive-500)";
	} else if (drift.hasSpike && drift.spikeDirection === "down") {
		categoryBg = "var(--success-900)";
		categoryFg = "var(--success-500)";
	} else if (drift.isAffective) {
		categoryBg = "var(--caution-900)";
		categoryFg = "var(--caution-500)";
	} else {
		categoryBg = "var(--primary-900)";
		categoryFg = "var(--primary-500)";
	}

	return (
		<Card id={id}>
			<CardHeader>
				<div>
					<H1 variant="h4">
						Risk Drift
						<GlossaryHint term="drift-category" />
					</H1>
					<P className="text-muted-foreground mt-1">
						Trend analysis split across the first and second half of the analysis window
					</P>
					<div className="mt-2.5">
						<Badge
							style={{
								backgroundColor: categoryBg,
								color: categoryFg,
								borderColor: "transparent",
							}}
							className="text-[10px] uppercase font-bold tracking-wider"
						>
							{drift.category}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-3">
					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<P className="text-muted-foreground text-sm uppercase">
							Earlier Period Average
						</P>
						<H1 variant="h3" className="mt-1 tabular-nums">
							{earlierAvg.toFixed(2)}
						</H1>
						<P className="text-muted-foreground mt-1 text-sm uppercase">
							First half of commit history
						</P>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<P className="text-sm uppercase" style={{ color: "var(--destructive-500)" }}>
							Later Period Average
						</P>
						<H1
							variant="h3"
							className="mt-1 tabular-nums"
							style={{ color: "var(--destructive-500)" }}
						>
							{laterAvg.toFixed(2)}
						</H1>
						<P className="text-muted-foreground mt-1 text-sm uppercase">
							Second half of commit history
						</P>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<P className="text-sm uppercase" style={{ color: "var(--destructive-500)" }}>
							Change
						</P>
						<H1
							variant="h3"
							className="mt-1 tabular-nums"
							style={{ color: "var(--destructive-500)" }}
						>
							{signStr}
							{pctChange}% {isUpward ? "↑" : "↓"}
						</H1>
						<P className="text-muted-foreground mt-1 text-sm uppercase">
							Directional drift in avg caution probability
						</P>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
