import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import * as v from "valibot";

import { FileAnalysisTour, startFileAnalysisDriverTour } from "@/components/file-analysis-tour";
import { RiskLabel } from "@/components/risk-label";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { H1, P } from "@/components/typography";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAnalysisQueryOptions } from "@/lib/github/api";
import { RISK_BANDS, riskBand, riskScale, riskSuggestions, summarizeFile } from "@/lib/interpret";

import { CommitSentimentCard } from "./-components/file-analysis/commit-sentiment-card";
import { ComplexityMetricsCard } from "./-components/file-analysis/complexity-metrics-card";
import { DriftGuidanceBanner } from "./-components/file-analysis/drift-guidance-banner";
import { RiskMeter } from "./-components/file-analysis/risk-meter";
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
	// Low files need no action, so no suggestions either.
	const suggestions = band === "low" ? [] : riskSuggestions(file.shapBreakdown);

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
					className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
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

			<Card id="tour-file-header" className="gap-0 py-0">
				<div className="h-1" style={{ backgroundColor: info.fill }} />
				<div className="space-y-5 p-6">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0">
							{dir && (
								<P className="text-muted-foreground font-mono text-sm">{dir}</P>
							)}
							<H1 variant="h2" className="truncate">
								{name}
							</H1>
						</div>
						<div className="flex items-center gap-3">
							<RiskLabel band={band} score={file.riskScore} size="md" />
							<Tabs value={view} onValueChange={(v) => setView(v as FileView)}>
								<TabsList>
									<TabsTrigger value="simple">Simple</TabsTrigger>
									<TabsTrigger value="detailed">Detailed</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					</div>

					<div className="w-full space-y-2">
						<P className="text-foreground text-lg leading-snug">
							{summarizeFile(file, scale)}
						</P>
						<P className="text-muted-foreground flex items-start gap-2 text-sm w-full">
							<ArrowRightIcon className="text-foreground mt-0.5 size-4 shrink-0" />
							<span>
								<span className="text-foreground font-semibold">What to do: </span>
								{info.action}
								{/* One paragraph instead of a separate list: same advice, less clutter. */}
								{suggestions.length > 0 && ` ${suggestions.join(" ")}`}
							</span>
						</P>
					</div>

					<RiskMeter file={file} allFiles={allFiles} scale={scale} band={band} />

					{view === "simple" && <DriftGuidanceBanner file={file} />}
				</div>
			</Card>

			{/* Always shown: the trend is the core early-detection signal (see Ch. 3). */}
			<SentimentTrajectoryCard file={file} id="tour-file-sentiment" />

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
