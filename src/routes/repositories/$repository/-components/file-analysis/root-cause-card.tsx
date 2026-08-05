import { InfoIcon } from "lucide-react";
import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

export function RootCauseCard({ file }: { file: FileRiskResult }): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const validCommits = [...file.commitSentiments]
		.filter((c) => c.riskProbability != null)
		.sort((a, b) => (b.riskProbability ?? 0) - (a.riskProbability ?? 0));

	if (validCommits.length === 0) return null;

	const rootCommit = validCommits[0];
	const cautionProb = rootCommit.riskProbability ?? 0;

	const s = file.shapBreakdown;
	const affectiveSum = Math.max(
		0,
		(s?.sentimentContrib ?? 0) + Math.max(0, s?.lowInfoContrib ?? 0),
	);
	const structuralSum = Math.max(
		0,
		(s?.entropyContrib ?? 0) +
			(s?.ndevContrib ?? 0) +
			(s?.ageContrib ?? 0) +
			(s?.complexityContrib ?? 0) +
			(s?.commitsContrib ?? 0),
	);

	const totalShap = Math.max(0.01, affectiveSum + structuralSum);
	const sentimentPct = Math.round((affectiveSum / totalShap) * 100);
	const complexityPct = Math.round((structuralSum / totalShap) * 100);

	const isAffective = affectiveSum > structuralSum;

	let guidanceText =
		"Complex but stable legacy file with no active degradation. Keep it in the routine maintenance queue.";
	if (isAffective) {
		guidanceText =
			"Developer sentiment is declining without much structural change. Check for unclear specs, repeated rework, or ownership issues.";
	} else {
		guidanceText =
			"This file is degrading quickly. Review recent commits before the next sprint to prevent further structural damage.";
	}

	const dateStr = new Date(rootCommit.committedAt * 1000).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Card>
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<span className="font-fira-mono text-muted-foreground text-xs font-bold">
								{rootCommit.hash.slice(0, 7)}
							</span>
							<span className="font-fira-mono text-muted-foreground/60 text-xs">
								· {dateStr}
							</span>
						</div>
						<p className="font-fira-mono text-foreground mt-1 text-base font-bold">
							"{rootCommit.message}"
						</p>
					</div>
					<Badge
						style={{
							backgroundColor: "var(--destructive-900)",
							color: "var(--destructive-500)",
							borderColor: "transparent",
						}}
						className="shrink-0 font-bold"
					>
						Caution
					</Badge>
				</div>

				<div className="space-y-2 border-t border-border/30 pt-3">
					<p className="font-fira-mono text-muted-foreground text-xs font-bold">
						Caution probability:{" "}
						<span style={{ color: "var(--destructive-500)" }}>
							{cautionProb.toFixed(2)}
						</span>
					</p>

					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-xs">
								Sentiment:
							</span>
							<div className="bg-background-700 h-2 flex-1 overflow-hidden rounded-full">
								<div
									className="h-2 rounded-full"
									style={{
										width: `${sentimentPct}%`,
										backgroundColor: "var(--destructive-500)",
									}}
								/>
							</div>
							<span className="font-fira-mono text-foreground w-10 text-right text-xs font-bold tabular-nums">
								{sentimentPct}%
							</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-xs">
								Complexity:
							</span>
							<div className="bg-background-700 h-2 flex-1 overflow-hidden rounded-full">
								<div
									className="h-2 rounded-full"
									style={{
										width: `${complexityPct}%`,
										backgroundColor: "var(--primary-500)",
									}}
								/>
							</div>
							<span className="font-fira-mono text-foreground w-10 text-right text-xs font-bold tabular-nums">
								{complexityPct}%
							</span>
						</div>
					</div>
				</div>

				<div className="bg-background-800 border-border/40 flex items-start gap-2.5 rounded-lg border p-3">
					<InfoIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
					<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed">
						{guidanceText}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
