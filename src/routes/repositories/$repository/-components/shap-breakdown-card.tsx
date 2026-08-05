import type { JSX } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

import { riskColor } from "./heatmap";

export function ShapBreakdownCard({ file }: { file: FileRiskResult }): JSX.Element | null {
	const s = file.shapBreakdown;
	if (!s) return null;

	const rows = [
		{
			label: "Sentiment score",
			barWidth: file.sentimentScore,
			value: file.sentimentScore.toFixed(2),
			contrib: s.sentimentContrib,
		},
		{
			label: "Complexity score",
			barWidth: file.complexityScore,
			value: file.complexityScore.toFixed(2),
			contrib: s.complexityContrib,
		},
		{
			label: "Change entropy",
			barWidth: file.changeEntropy,
			value: file.changeEntropy.toFixed(2),
			contrib: s.entropyContrib,
		},
		{
			label: "NDev score",
			barWidth: file.ndevScore,
			value: file.ndevScore.toFixed(2),
			contrib: s.ndevContrib,
		},
		{
			label: "Low info ratio",
			barWidth: file.lowInfoRatio,
			value: file.lowInfoRatio.toFixed(2),
			contrib: s.lowInfoContrib,
		},
		{
			label: "Age score",
			barWidth: file.ageScore,
			value: file.ageScore.toFixed(2),
			contrib: s.ageContrib,
		},
		{
			label: "Number of commits",
			barWidth: Math.min(file.commitCount / 50, 1),
			value: String(file.commitCount),
			contrib: s.commitsContrib,
		},
	];

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">
					Why this score? — SHAP Breakdown
				</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
					SHAP decomposition of the logistic regression output — right raises risk, left
					lowers it
				</p>
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
					</span>
					<span
						className="font-fira-mono text-muted-foreground/60 text-xs"
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

				{rows.map(({ label, barWidth, value, contrib }) => {
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
					<span className="font-fira-mono text-muted-foreground text-xs tracking-widest uppercase">
						Final Risk Score
					</span>
					<span
						className="font-fira-mono-bold text-2xl tabular-nums"
						style={{ color: riskColor(file.riskScore ?? 0) }}
					>
						{(file.riskScore ?? 0).toFixed(2)}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
