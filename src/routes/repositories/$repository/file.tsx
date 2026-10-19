import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, FileIcon } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import * as v from "valibot";

import { FileAnalysisTour, startFileAnalysisDriverTour } from "@/components/file-analysis-tour";
import { RiskLabel } from "@/components/risk-label";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { H1, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAnalysisQueryOptions } from "@/lib/github/api";
import { RISK_BANDS, riskBand, riskScale, summarizeFile } from "@/lib/interpret";

import { CommitSentimentCard } from "./-components/file-analysis/commit-sentiment-card";
import { ComplexityMetricsCard } from "./-components/file-analysis/complexity-metrics-card";
import { DriftGuidanceBanner } from "./-components/file-analysis/drift-guidance-banner";
import { RootCauseCard } from "./-components/file-analysis/root-cause-card";
import { SentimentTrajectoryCard } from "./-components/file-analysis/sentiment-trajectory-card";
import { ShapBreakdownCard } from "./-components/file-analysis/shap-breakdown-card";

type FileView = "simple" | "detailed";

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

const FILE_TOUR_SEEN_KEY = "gomi:file-tour-seen";

function RouteComponent(): JSX.Element {
	const { file, threshold, allFiles } = Route.useLoaderData();
	const { repository } = Route.useParams();
	const [showFileTour, setShowFileTour] = useState(
		() => localStorage.getItem(FILE_TOUR_SEEN_KEY) !== "1",
	);
	// Simple by default; the tour needs Detailed because its anchor ids live there.
	const [view, setView] = useState<FileView>(() => (showFileTour ? "detailed" : "simple"));

	const scale = useMemo(() => riskScale(allFiles, threshold), [allFiles, threshold]);
	const band = riskBand(file.riskScore, file.lowConfidence, scale);
	const info = RISK_BANDS[band];

	function dismissFileTour() {
		localStorage.setItem(FILE_TOUR_SEEN_KEY, "1");
		setShowFileTour(false);
	}

	const parts = file.filename.split("/");
	const name = parts.pop() ?? file.filename;
	const dir = parts.length > 0 ? parts.join("/") + "/" : "";

	return (
		<div className="mx-auto w-full max-w-5xl space-y-3 p-4 pb-12">
			{showFileTour && <FileAnalysisTour onDone={dismissFileTour} />}

			<div className="flex items-center justify-between gap-3">
				<Link
					to="/repositories/$repository"
					params={{ repository }}
					className="font-fira-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
				>
					<ArrowLeftIcon className="size-4" />
					Back to {repository}
				</Link>
				<TourTriggerButton
					onClick={() => {
						setView("detailed");
						// wait one frame so the Detailed cards are mounted before driver.js looks them up
						requestAnimationFrame(() => startFileAnalysisDriverTour());
					}}
				/>
			</div>

			<Card id="tour-file-header">
				<CardHeader>
					<div className="w-full">
						<div className="mb-2 flex items-center justify-between gap-3">
							{dir ? (
								<P className="text-muted-foreground text-sm">{dir}</P>
							) : (
								<span />
							)}
							<Tabs value={view} onValueChange={(v) => setView(v as FileView)}>
								<TabsList>
									<TabsTrigger value="simple">Simple</TabsTrigger>
									<TabsTrigger value="detailed">Detailed</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
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
								<FileIcon className="size-5 shrink-0" style={{ color: info.fg }} />
								<H1
									variant="h3"
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{name}
								</H1>
							</div>
							<RiskLabel band={band} score={file.riskScore} />
						</div>
						<div
							className="mt-4 space-y-2 rounded-lg border p-3"
							style={{ borderColor: info.fg }}
						>
							<P className="text-foreground text-base">
								{summarizeFile(file, scale)}
							</P>
							<P className="text-muted-foreground text-sm">
								<span className="font-fira-mono-bold text-foreground">
									What to do:{" "}
								</span>
								{info.action}
							</P>
						</div>
					</div>
				</CardHeader>
				{view === "simple" && (
					<CardContent className="space-y-3">
						<DriftGuidanceBanner file={file} />
					</CardContent>
				)}
			</Card>

			{/* Always shown: the trend is the core early-detection signal (see Ch. 3). */}
			<SentimentTrajectoryCard file={file} id="tour-file-sentiment" />

			{view === "simple" && (
				<P className="text-muted-foreground text-sm">
					Switch to <b>Detailed</b> for what drives this score and the code measurements.
				</P>
			)}

			{view === "detailed" && (
				<>
					<RootCauseCard file={file} id="tour-file-rootcause" />
					<CommitSentimentCard file={file} id="tour-file-commits" />
					<ShapBreakdownCard file={file} scale={scale} id="tour-file-shap" />
					<ComplexityMetricsCard
						file={file}
						allFiles={allFiles}
						id="tour-file-complexity"
					/>
				</>
			)}
		</div>
	);
}
