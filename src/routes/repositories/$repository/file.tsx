import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	CircleCheckIcon,
	FileIcon,
	MinusCircleIcon,
	TriangleAlertIcon,
} from "lucide-react";
import type { JSX } from "react";
import * as v from "valibot";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loadAnalysis, type FileRiskResult } from "@/lib/github/model";

import { riskColor } from "./-components/heatmap";

export const Route = createFileRoute("/repositories/$repository/file")({
	validateSearch: v.object({ path: v.string() }),
	loaderDeps: ({ search }) => ({ path: search.path }),
	component: RouteComponent,
	loader: ({ params, deps }) => {
		const analysis = loadAnalysis(params.repository);
		if (!analysis) throw redirect({ to: "/repositories" });
		const file = analysis.fileResults.find((f) => f.filename === deps.path);
		if (!file) throw redirect({ to: "/repositories/$repository", params });
		return { file, threshold: analysis.threshold };
	},
});

function RiskBadge({
	score,
	threshold,
	lowConf,
}: {
	score: number | null;
	threshold: number;
	lowConf: boolean;
}): JSX.Element {
	if (lowConf) {
		return (
			<Badge
				className="gap-1"
				style={{
					backgroundColor: "var(--dark-500)",
					color: "var(--text-subtle)",
					borderColor: "transparent",
				}}
			>
				<MinusCircleIcon className="size-3" />
				Low Conf
			</Badge>
		);
	}
	if (score != null && score >= threshold) {
		return (
			<Badge
				className="gap-1"
				style={{
					backgroundColor: "var(--destructive-900)",
					color: "var(--destructive-500)",
					border: "1px solid color-mix(in srgb, var(--destructive-500) 40%, transparent)",
				}}
			>
				<TriangleAlertIcon className="size-3" />
				Risky
			</Badge>
		);
	}
	return (
		<Badge
			className="gap-1"
			style={{
				backgroundColor: "var(--success-900)",
				color: "var(--success-500)",
				borderColor: "transparent",
			}}
		>
			<CircleCheckIcon className="size-3" />
			Acceptable
		</Badge>
	);
}

// ponytail: inline styles for grid/bar to avoid Tailwind class detection race on new files
function ShapBreakdownCard({ file }: { file: FileRiskResult }): JSX.Element | null {
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
				{/* Base rate row */}
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
							{/* Bar track */}
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

				{/* Final score */}
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

function SentimentBadge({ code }: { code: string | undefined }): JSX.Element {
	if (code === "caution") {
		return (
			<span
				className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
				style={{
					backgroundColor: "var(--destructive-900)",
					color: "var(--destructive-500)",
				}}
			>
				Caution
			</span>
		);
	}
	if (code === "satisfaction") {
		return (
			<span
				className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
				style={{
					backgroundColor: "var(--success-900)",
					color: "var(--success-500)",
				}}
			>
				Satisfaction
			</span>
		);
	}
	return (
		<span
			className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
			style={{
				backgroundColor: "var(--background-700)",
				color: "var(--text-subtle)",
			}}
		>
			Neutral
		</span>
	);
}

function timeAgo(ts: number): string {
	const days = Math.floor(Date.now() / 1000 / 86400 - ts / 86400);
	if (days === 0) return "today";
	if (days === 1) return "1 day ago";
	return `${days} days ago`;
}

function CommitSentimentCard({ file }: { file: FileRiskResult }): JSX.Element {
	const commits = [...file.commitSentiments].sort((a, b) => b.committedAt - a.committedAt);
	const total = commits.length;
	const cautionCount = commits.filter((c) => c.sentiment?.code === "caution").length;
	const neutralCount = commits.filter((c) => c.sentiment?.code === "neutral").length;
	const satisfactionCount = commits.filter((c) => c.sentiment?.code === "satisfaction").length;
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	const tiles = [
		{
			label: "Caution",
			count: cautionCount,
			color: "var(--destructive-500)",
			bg: "color-mix(in srgb, var(--destructive-900) 80%, transparent)",
		},
		{
			label: "Neutral",
			count: neutralCount,
			color: "var(--foreground)",
			bg: "var(--background-800)",
		},
		{
			label: "Satisfaction",
			count: satisfactionCount,
			color: "var(--success-500)",
			bg: "color-mix(in srgb, var(--success-900) 80%, transparent)",
		},
	];

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Commit sentiment</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs tracking-widest uppercase">
					{total} commits analyzed by DistilBERT · 6-month window
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 3-column tiles */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: "0.75rem",
					}}
				>
					{tiles.map(({ label, count, color, bg }) => (
						<div
							key={label}
							style={{
								borderRadius: "0.5rem",
								border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
								padding: "1rem",
								backgroundColor: bg,
							}}
						>
							<p className="font-fira-mono mb-1 text-sm" style={{ color }}>
								{label}
							</p>
							<p className="font-fira-mono-bold text-3xl" style={{ color }}>
								{pct(count)}%
							</p>
							<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
								{count} of {total} commits
							</p>
						</div>
					))}
				</div>

				{/* Commit list */}
				<div>
					<p className="font-fira-mono text-muted-foreground mb-2 text-xs tracking-widest uppercase">
						Commits
					</p>
					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							overflow: "hidden",
							backgroundColor: "var(--background-800)",
						}}
					>
						{commits.length === 0 ? (
							<p className="font-fira-mono text-muted-foreground px-4 py-3 text-sm">
								No commits in window.
							</p>
						) : (
							commits.map((c) => (
								<div
									key={c.hash}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.75rem",
										padding: "0.75rem 1rem",
										borderBottom:
											"1px solid color-mix(in srgb, var(--border) 20%, transparent)",
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											className="font-fira-mono text-foreground text-sm"
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											"{c.message}"
										</p>
										<p className="font-fira-mono text-muted-foreground mt-0.5 text-xs">
											{c.hash.slice(0, 7)} · {timeAgo(c.committedAt)}
											{c.lowInfo && " · low info"}
										</p>
									</div>
									<SentimentBadge code={c.sentiment?.code} />
								</div>
							))
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ComplexityMetricsCard({ file }: { file: FileRiskResult }): JSX.Element {
	const metrics = [
		{
			label: "Complexity score",
			value: file.complexityScore.toFixed(2),
			desc: "normalized Lizard complexity",
		},
		{
			label: "Change entropy",
			value: file.changeEntropy.toFixed(2),
			desc: "how dispersed edits are across the file",
		},
		{
			label: "NDev score",
			value: file.ndevScore.toFixed(2),
			desc: "distinct developers who touched it",
		},
		{ label: "Age score", value: file.ageScore.toFixed(2), desc: "normalized churn recency" },
		{
			label: "Low info ratio",
			value: file.lowInfoRatio.toFixed(2),
			desc: "share of low-information commits",
		},
		{
			label: "Number of commits",
			value: String(file.commitCount),
			desc: "commits in analysis window",
		},
		{ label: "Avg CCN", value: file.avgCcn.toFixed(1), desc: "average cyclomatic complexity" },
		{ label: "Avg NLOC", value: file.avgNloc.toFixed(1), desc: "average lines per function" },
	];

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Complexity metrics</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
					Lizard static analysis + repository process metrics
				</p>
			</CardHeader>
			<CardContent>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "0.75rem",
					}}
				>
					{metrics.map(({ label, value, desc }) => (
						<div
							key={label}
							style={{
								borderRadius: "0.5rem",
								border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
								padding: "1rem",
								backgroundColor: "var(--background-800)",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "flex-start",
									justifyContent: "space-between",
									gap: "0.5rem",
								}}
							>
								<p className="font-fira-mono-bold text-foreground text-sm">
									{label}
								</p>
								<p
									className="font-fira-mono-bold shrink-0 text-lg tabular-nums"
									style={{ color: "var(--caution-500)" }}
								>
									{value}
								</p>
							</div>
							<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
								{desc}
							</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function RouteComponent(): JSX.Element {
	const { file, threshold } = Route.useLoaderData();
	const { repository } = Route.useParams();

	const parts = file.filename.split("/");
	const name = parts.pop() ?? file.filename;
	const dir = parts.length > 0 ? parts.join("/") + "/" : "";

	return (
		<div className="mx-auto w-full max-w-3xl space-y-3 p-4 pb-12">
			<Link
				to="/repositories/$repository"
				params={{ repository }}
				className="font-fira-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				Back to {repository}
			</Link>

			<Card>
				<CardHeader>
					<div className="w-full">
						{dir && (
							<p className="font-fira-mono text-muted-foreground mb-1 text-xs">
								{dir}
							</p>
						)}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: "0.75rem",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									minWidth: 0,
								}}
							>
								<FileIcon
									className="size-5 shrink-0"
									style={{ color: "var(--destructive-500)" }}
								/>
								<h1
									className="font-fira-mono-bold text-foreground text-3xl"
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{name}
								</h1>
							</div>
							<RiskBadge
								score={file.riskScore}
								threshold={threshold}
								lowConf={file.lowConfidence}
							/>
						</div>
						{/* Risk bar — only for files with a score */}
						{!file.lowConfidence && file.riskScore != null && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									marginTop: "1rem",
								}}
							>
								<div
									style={{
										flex: 1,
										height: "0.75rem",
										borderRadius: "999px",
										overflow: "hidden",
										backgroundColor: "var(--background-700)",
									}}
								>
									<div
										style={{
											height: "0.75rem",
											borderRadius: "999px",
											width: `${file.riskScore * 100}%`,
											backgroundColor: riskColor(file.riskScore),
										}}
									/>
								</div>
								<span className="font-fira-mono-bold text-foreground text-xl tabular-nums">
									{file.riskScore.toFixed(2)}
								</span>
							</div>
						)}
					</div>
				</CardHeader>
			</Card>

			<ShapBreakdownCard file={file} />
			<CommitSentimentCard file={file} />
			<ComplexityMetricsCard file={file} />
		</div>
	);
}
