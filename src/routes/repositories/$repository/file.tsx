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
import { Card, CardHeader } from "@/components/ui/card";
import { loadAnalysis } from "@/lib/github/model";

import { CommitSentimentCard } from "./-components/commit-sentiment-card";
import { ComplexityMetricsCard } from "./-components/complexity-metrics-card";
import { riskColor } from "./-components/heatmap";
import { SentimentTrajectoryCard } from "./-components/sentiment-trajectory-card";
import { ShapBreakdownCard } from "./-components/shap-breakdown-card";

export const Route = createFileRoute("/repositories/$repository/file")({
	validateSearch: v.object({ path: v.string() }),
	loaderDeps: ({ search }) => ({ path: search.path }),
	component: RouteComponent,
	loader: ({ params, deps }) => {
		const analysis = loadAnalysis(params.repository);
		if (!analysis) throw redirect({ to: "/repositories" });
		const file = analysis.fileResults.find((f) => f.filename === deps.path);
		if (!file) throw redirect({ to: "/repositories/$repository", params });
		return { file, threshold: analysis.threshold, allFiles: analysis.fileResults };
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

function RouteComponent(): JSX.Element {
	const { file, threshold, allFiles } = Route.useLoaderData();
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

			<SentimentTrajectoryCard file={file} threshold={threshold} />
			<ShapBreakdownCard file={file} />
			<CommitSentimentCard file={file} />
			<ComplexityMetricsCard file={file} allFiles={allFiles} />
		</div>
	);
}
