import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import { CAUTION_THRESHOLD, fmtDate, MIN_TREND_POINTS, toneVsStructure } from "@/lib/interpret";

import { DriftGuidanceBanner } from "./drift-guidance-banner";
import { computeDrift } from "./drift-utils";

export function RootCauseCard({
	file,
	id,
}: {
	file: FileRiskResult;
	id?: string;
}): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < MIN_TREND_POINTS) {
		return null;
	}

	const drift = computeDrift(file.commitSentiments, file.shapBreakdown);

	// guidance only shown when a spike is detected and root cause commit is identified
	if (!drift || !drift.rootCauseCommit) return null;

	const rootCommit = drift.rootCauseCommit;
	const cautionProb = rootCommit.riskProbability ?? 0;

	// Root cause only meaningful if the commit itself reads as worried
	if (cautionProb < CAUTION_THRESHOLD) return null;

	const { tone: affectiveSum, structure: structuralSum } = toneVsStructure(file.shapBreakdown);
	const totalShap = Math.max(0.01, affectiveSum + structuralSum);
	const sentimentPct = Math.round((affectiveSum / totalShap) * 100);
	const complexityPct = Math.round((structuralSum / totalShap) * 100);
	const driver =
		sentimentPct >= 60
			? "mostly by the tone of its commit messages"
			: complexityPct >= 60
				? "mostly by its code structure and change history"
				: "about equally by commit tone and by code structure";

	const commitDate = new Date(rootCommit.committedAt * 1000);
	const dateStr = fmtDate(rootCommit.committedAt);
	const dayLabel = commitDate.toLocaleDateString(undefined, { weekday: "long" });
	const timeLabel = commitDate.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">Where the worry started</H1>
				<P className="text-muted-foreground">
					The change where commit messages for this file first turned noticeably more
					worried
				</P>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1">
					<P className="text-foreground text-sm">
						This file's risk is driven {driver}.
						<GlossaryHint term="caution-probability" />
					</P>
					<P className="text-xs" style={{ color: "var(--text-subtle)" }}>
						Commit tone {sentimentPct}% · code structure and history {complexityPct}% of
						the score's influence
					</P>
				</div>

				<DriftGuidanceBanner file={file} />

				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm font-bold">
								{rootCommit.hash.slice(0, 7)}
							</span>
							<span className="text-muted-foreground/60 text-sm">
								· {dateStr}
							</span>
						</div>
						<P className="mt-1 font-bold">"{rootCommit.message}"</P>
					</div>
					<Badge
						style={{
							backgroundColor: "var(--destructive-900)",
							color: "var(--destructive-500)",
							borderColor: "transparent",
						}}
						className="shrink-0 font-bold"
					>
						Worried tone
					</Badge>
				</div>

				{/* Commit Provenance — Tier 1 socio-technical context */}
				{(rootCommit.author ||
					rootCommit.linesAdded != null ||
					rootCommit.linesDeleted != null ||
					rootCommit.coChangedFiles != null) && (
					<div className="border-border/30 space-y-1.5 border-t pt-3">
						<P className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
							Commit Context
						</P>
						<div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
							<span className="text-muted-foreground/60">Author</span>
							<span className="text-foreground truncate">
								{rootCommit.author || (
									<span className="text-muted-foreground/40 italic">unknown</span>
								)}
							</span>
							<span className="text-muted-foreground/60">When</span>
							<span className="text-foreground">
								{dayLabel} · {timeLabel}
							</span>
							{rootCommit.linesAdded != null && rootCommit.linesDeleted != null && (
								<>
									<span className="text-muted-foreground/60">
										Lines added / removed
									</span>
									<span>
										<span style={{ color: "var(--success-500, #4ade80)" }}>
											+{rootCommit.linesAdded}
										</span>{" "}
										<span style={{ color: "var(--destructive-500)" }}>
											−{rootCommit.linesDeleted}
										</span>
									</span>
								</>
							)}
							{rootCommit.coChangedFiles != null && (
								<>
									<span className="text-muted-foreground/60">
										Changed together with
									</span>
									<span className="text-foreground">
										{rootCommit.coChangedFiles}{" "}
										{rootCommit.coChangedFiles === 1
											? "other file"
											: "other files"}
									</span>
								</>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
