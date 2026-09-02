import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, FileIcon } from "lucide-react";
import { useState, type JSX } from "react";
import * as v from "valibot";

import { FileAnalysisTour } from "@/components/file-analysis-tour";
import { Card, CardHeader } from "@/components/ui/card";
import { getAnalysisQueryOptions } from "@/lib/github/api";
import { useTheme } from "@/lib/theme";

import { CommitSentimentCard } from "./-components/file-analysis/commit-sentiment-card";
import { ComplexityMetricsCard } from "./-components/file-analysis/complexity-metrics-card";
import { RiskDriftCard } from "./-components/file-analysis/risk-drift-card";
import { RootCauseCard } from "./-components/file-analysis/root-cause-card";
import { SentimentTrajectoryCard } from "./-components/file-analysis/sentiment-trajectory-card";
import { ShapBreakdownCard } from "./-components/file-analysis/shap-breakdown-card";
import { riskColor } from "./-components/repo-overview/heatmap";

export const Route = createFileRoute("/repositories/$repository/file")({
	validateSearch: v.object({ path: v.string() }),
	loaderDeps: ({ search }) => ({ path: search.path }),
	component: RouteComponent,
	loader: async ({ params, deps, context }) => {
		let analysis;
		try {
			analysis = await context.queryClient.ensureQueryData(
				getAnalysisQueryOptions(params.repository),
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error("[file loader] failed to load analysis for", params.repository, e);
			if (msg.toLowerCase().includes("not found")) {
				throw redirect({ to: "/repositories" });
			}
			throw e;
		}
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
			<span
				className="font-fira-mono rounded px-2.5 py-1 text-xs font-medium"
				style={{
					backgroundColor: "var(--dark-500)",
					color: "var(--text-subtle)",
				}}
			>
				Low Confidence
			</span>
		);
	}

	if (score == null) return <></>;

	const isRisky = score >= threshold;
	return (
		<span
			className="font-fira-mono rounded px-2.5 py-1 text-xs font-bold"
			style={{
				backgroundColor: isRisky ? "var(--destructive-900)" : "var(--success-900)",
				color: isRisky ? "var(--destructive-500)" : "var(--success-500)",
			}}
		>
			{isRisky ? "Risky" : "Acceptable"} ({score.toFixed(2)})
		</span>
	);
}

const FILE_TOUR_SEEN_KEY = "gomi:file-tour-seen";

function RouteComponent(): JSX.Element {
	const { file, threshold, allFiles } = Route.useLoaderData();
	const { repository } = Route.useParams();
	const { theme } = useTheme();

	const [showFileTour, setShowFileTour] = useState(
		() => localStorage.getItem(FILE_TOUR_SEEN_KEY) !== "1",
	);

	function dismissFileTour() {
		localStorage.setItem(FILE_TOUR_SEEN_KEY, "1");
		setShowFileTour(false);
	}

	const parts = file.filename.split("/");
	const name = parts.pop() ?? file.filename;
	const dir = parts.length > 0 ? parts.join("/") + "/" : "";

	return (
		<div className="mx-auto w-full max-w-3xl space-y-3 p-4 pb-12">
			{showFileTour && <FileAnalysisTour onDone={dismissFileTour} />}

			<Link
				to="/repositories/$repository"
				params={{ repository }}
				className="font-fira-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				Back to {repository}
			</Link>

			<Card id="tour-file-header">
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
											backgroundColor: riskColor(file.riskScore, theme),
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

			<SentimentTrajectoryCard file={file} threshold={threshold} id="tour-file-sentiment" />
			<RootCauseCard file={file} threshold={threshold} id="tour-file-rootcause" />
			<CommitSentimentCard file={file} id="tour-file-commits" />
			<RiskDriftCard file={file} id="tour-file-drift" />
			<ShapBreakdownCard file={file} id="tour-file-shap" />
			<ComplexityMetricsCard file={file} allFiles={allFiles} id="tour-file-complexity" />
		</div>
	);
}
