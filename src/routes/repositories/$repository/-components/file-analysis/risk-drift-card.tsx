import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

export function RiskDriftCard({ file }: { file: FileRiskResult }): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const validCommits = [...file.commitSentiments]
		.filter((c) => c.riskProbability != null)
		.sort((a, b) => a.committedAt - b.committedAt);

	if (validCommits.length < 10) return null;

	const mid = Math.floor(validCommits.length / 2);
	const earlierCommits = validCommits.slice(0, mid);
	const laterCommits = validCommits.slice(mid);

	const earlierAvg =
		earlierCommits.reduce((acc, c) => acc + (c.riskProbability ?? 0), 0) /
		earlierCommits.length;
	const laterAvg =
		laterCommits.reduce((acc, c) => acc + (c.riskProbability ?? 0), 0) /
		laterCommits.length;

	const diff = laterAvg - earlierAvg;
	const pctChange = earlierAvg > 0 ? Math.round((diff / earlierAvg) * 100) : 0;

	const s = file.shapBreakdown;
	const affectiveSum = (s?.sentimentContrib ?? 0) + Math.max(0, s?.lowInfoContrib ?? 0);
	const structuralSum =
		(s?.entropyContrib ?? 0) +
		(s?.ndevContrib ?? 0) +
		(s?.ageContrib ?? 0) +
		(s?.complexityContrib ?? 0) +
		(s?.commitsContrib ?? 0);

	const isAffective = affectiveSum > structuralSum;

	let categoryLabel = "Passive Legacy Debt";
	let categoryBg = "var(--primary-900)";
	let categoryFg = "var(--primary-500)";

	if (diff > 0.05) {
		if (isAffective) {
			categoryLabel = "Developer Frustration Drift";
			categoryBg = "var(--destructive-900)";
			categoryFg = "var(--destructive-500)";
		} else {
			categoryLabel = "Accelerating Debt Hotspot";
			categoryBg = "var(--destructive-900)";
			categoryFg = "var(--destructive-500)";
		}
	} else if (diff < -0.05) {
		categoryLabel = "Refactoring Recovery";
		categoryBg = "var(--success-900)";
		categoryFg = "var(--success-500)";
	} else {
		if (isAffective) {
			categoryLabel = "Developer Frustration Drift";
			categoryBg = "var(--caution-900)";
			categoryFg = "var(--caution-500)";
		} else {
			categoryLabel = "Passive Legacy Debt";
			categoryBg = "var(--primary-900)";
			categoryFg = "var(--primary-500)";
		}
	}

	const isUpward = diff > 0;
	const signStr = isUpward ? "+" : "";

	return (
		<Card>
			<CardHeader>
				<div>
					<p className="font-fira-mono-bold text-foreground text-xl">Risk Drift</p>
					<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
						Trend analysis split across the first and second half of the analysis window
					</p>
					<div className="mt-2.5">
						<Badge
							style={{
								backgroundColor: categoryBg,
								color: categoryFg,
								borderColor: "transparent",
							}}
							className="text-[10px] uppercase font-bold tracking-wider"
						>
							{categoryLabel}
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
						<p className="font-fira-mono text-muted-foreground text-xs uppercase">
							Earlier Period Average
						</p>
						<p className="font-fira-mono-bold text-foreground mt-1 text-3xl tabular-nums">
							{earlierAvg.toFixed(2)}
						</p>
						<p className="font-fira-mono text-muted-foreground/60 mt-1 text-[10px] uppercase">
							First half of commit history
						</p>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<p className="font-fira-mono text-xs uppercase" style={{ color: "var(--destructive-500)" }}>
							Later Period Average
						</p>
						<p className="font-fira-mono-bold mt-1 text-3xl tabular-nums" style={{ color: "var(--destructive-500)" }}>
							{laterAvg.toFixed(2)}
						</p>
						<p className="font-fira-mono text-muted-foreground/60 mt-1 text-[10px] uppercase">
							Second half of commit history
						</p>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<p className="font-fira-mono text-xs uppercase" style={{ color: "var(--destructive-500)" }}>
							Change
						</p>
						<p className="font-fira-mono-bold mt-1 text-3xl tabular-nums" style={{ color: "var(--destructive-500)" }}>
							{signStr}
							{pctChange}% {isUpward ? "↑" : "↓"}
						</p>
						<p className="font-fira-mono text-muted-foreground/60 mt-1 text-[10px] uppercase">
							Directional drift in avg caution probability
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
