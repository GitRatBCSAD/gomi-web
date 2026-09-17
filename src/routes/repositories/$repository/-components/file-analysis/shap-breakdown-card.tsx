import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import type { GlossaryKey } from "@/lib/glossary";
import { useTheme } from "@/lib/theme";

import { riskColor } from "../repo-overview/heatmap";

export function ShapBreakdownCard({
	file,
	id,
}: {
	file: FileRiskResult;
	id?: string;
}): JSX.Element | null {
	const { theme } = useTheme();
	const s = file.shapBreakdown;
	if (!s) return null;

	const rows: {
		label: string;
		term: GlossaryKey;
		barWidth: number;
		value: string;
		contrib: number;
	}[] = [
		{
			label: "Sentiment score",
			term: "sentiment-score",
			barWidth: file.sentimentScore,
			value: file.sentimentScore.toFixed(2),
			contrib: s.sentimentContrib,
		},
		{
			label: "Complexity score",
			term: "complexity-score",
			barWidth: file.complexityScore,
			value: file.complexityScore.toFixed(2),
			contrib: s.complexityContrib,
		},
		{
			label: "Change entropy",
			term: "change-entropy",
			barWidth: file.changeEntropy,
			value: file.changeEntropy.toFixed(2),
			contrib: s.entropyContrib,
		},
		{
			label: "NDev score",
			term: "ndev",
			barWidth: file.ndevScore,
			value: file.ndevScore.toFixed(2),
			contrib: s.ndevContrib,
		},
		{
			label: "Low info ratio",
			term: "low-info-ratio",
			barWidth: file.lowInfoRatio,
			value: file.lowInfoRatio.toFixed(2),
			contrib: s.lowInfoContrib,
		},
		{
			label: "Age score",
			term: "age-score",
			barWidth: file.ageScore,
			value: file.ageScore.toFixed(2),
			contrib: s.ageContrib,
		},
		{
			label: "Number of commits",
			term: "n-commits",
			barWidth: Math.min(file.commitCount / 50, 1),
			value: String(file.commitCount),
			contrib: s.commitsContrib,
		},
	];

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">
					Why this score? — SHAP Breakdown
					<GlossaryHint term="shap" />
				</H1>
				<P className="text-muted-foreground">
					SHAP decomposition of the logistic regression output — right raises risk, left
					lowers it
				</P>
			</CardHeader>
			<CardContent>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.75rem",
						paddingTop: "0.625rem",
						paddingBottom: "0.625rem",
						borderBottom:
							"1px solid color-mix(in srgb, var(--border) 30%, transparent)",
					}}
				>
					<span
						className="font-fira-mono text-muted-foreground text-sm"
						style={{ width: "11rem", flexShrink: 0 }}
					>
						Base rate
						<GlossaryHint term="base-rate" />
					</span>
					<span
						className="font-fira-mono text-muted-foreground text-sm"
						style={{ flex: 1 }}
					>
						repo average
					</span>
					<span
						className="font-fira-mono text-foreground text-sm font-bold tabular-nums"
						style={{ width: "2.5rem", textAlign: "right" }}
					>
						{s.baseRate.toFixed(2)}
					</span>
					<span style={{ width: "3.5rem" }} />
				</div>

				{rows.map(({ label, term, barWidth, value, contrib }) => {
					const positive = contrib >= 0;
					const fillColor = positive ? "var(--destructive-500)" : "var(--primary-500)";
					return (
						<div
							key={label}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.75rem",
								paddingTop: "0.625rem",
								paddingBottom: "0.625rem",
								borderBottom:
									"1px solid color-mix(in srgb, var(--border) 20%, transparent)",
							}}
						>
							<span
								className="font-fira-mono text-foreground text-sm"
								style={{ width: "11rem", flexShrink: 0 }}
							>
								{label}
								<GlossaryHint term={term} />
							</span>
							<div
								style={{
									flex: 1,
									height: "0.5rem",
									borderRadius: "999px",
									overflow: "hidden",
									backgroundColor: "var(--background-700)",
								}}
							>
								<div
									style={{
										height: "0.5rem",
										borderRadius: "999px",
										width: `${Math.min(Math.max(barWidth, 0) * 100, 100)}%`,
										backgroundColor: fillColor,
									}}
								/>
							</div>
							<span
								className="font-fira-mono text-foreground text-sm tabular-nums"
								style={{ width: "2.5rem", textAlign: "right" }}
							>
								{value}
							</span>
							<span
								className="font-fira-mono text-sm tabular-nums"
								style={{ width: "3.5rem", textAlign: "right", color: fillColor }}
							>
								{positive ? "+" : ""}
								{contrib.toFixed(2)}
							</span>
						</div>
					);
				})}

				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						paddingTop: "1rem",
						marginTop: "0.5rem",
						borderTop: "1px solid color-mix(in srgb, var(--border) 40%, transparent)",
					}}
				>
					<span className="font-fira-mono text-muted-foreground text-sm tracking-widest uppercase">
						Final Risk Score
					</span>
					<span
						className="font-fira-mono-bold text-2xl tabular-nums"
						style={{ color: riskColor(file.riskScore ?? 0, theme) }}
					>
						{(file.riskScore ?? 0).toFixed(2)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
