import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useRouter } from "@tanstack/react-router";
import { RotateCcwIcon } from "lucide-react";
import { useEffect, useMemo, useState, type JSX } from "react";

import { H1 } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardAction } from "@/components/ui/card";
import {
	analyzeRepository,
	getAnalysisQueryOptions,
	getJobStatus,
	getRepositoriesQuery,
} from "@/lib/github/api";

import { Heatmap } from "./-components/repo-overview/heatmap";
import { RepoSummaryCards } from "./-components/repo-overview/repo-summary-cards";

const STEP_LABELS: Record<string, string> = {
	queued: "Queued...",
	cloning: "Cloning...",
	extracting_git: "Reading history...",
	scanning_complexity: "Scanning...",
	scoring_files: "Scoring...",
};

/** Returns a yyyy-mm-dd string for an <input type="date"> */
function toDateInput(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Default date range: today back 6 months */
function defaultRange(): { start: Date; end: Date } {
	const end = new Date();
	const start = new Date();
	start.setMonth(start.getMonth() - 6);
	return { start, end };
}

export const Route = createFileRoute("/repositories/$repository/")({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		try {
			return await context.queryClient.ensureQueryData(
				getAnalysisQueryOptions(params.repository),
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error("[loader] failed to load analysis for", params.repository, e);
			// Only redirect for explicit "not found" — let other errors surface
			if (msg.toLowerCase().includes("not found")) {
				throw redirect({ to: "/repositories" });
			}
			throw e;
		}
	},
});

function RouteComponent(): JSX.Element {
	const analysis = Route.useLoaderData();
	const { repository } = Route.useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showConfirm, setShowConfirm] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState<"all" | "risky" | "acceptable" | "low-conf">("all");
	const [pendingJobId, setPendingJobId] = useState<string | null>(null);

	// ── Date range ──────────────────────────────────────────────────────────
	const [dateRange, setDateRange] = useState(defaultRange);

	const isDefaultRange = useMemo(() => {
		const def = defaultRange();
		return (
			toDateInput(dateRange.start) === toDateInput(def.start) &&
			toDateInput(dateRange.end) === toDateInput(def.end)
		);
	}, [dateRange]);

	/** File results with commitSentiments filtered to the selected date window. */
	const filteredFileResults = useMemo(() => {
		const startTs = Math.floor(dateRange.start.getTime() / 1000);
		const endTs = Math.floor(dateRange.end.getTime() / 1000);
		return analysis.fileResults.map((f) => ({
			...f,
			commitSentiments: f.commitSentiments.filter(
				(c) => c.committedAt >= startTs && c.committedAt <= endTs,
			),
		}));
	}, [analysis.fileResults, dateRange]);
	// ────────────────────────────────────────────────────────────────────────

	const reposQuery = useQuery(getRepositoriesQuery);

	const repoName = analysis.repoUrl
		.replace(/\.git$/, "")
		.split("/")
		.slice(-2)
		.join("/");

	const risky = filteredFileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore >= analysis.threshold,
	).length;
	const acceptable = filteredFileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore < analysis.threshold,
	).length;
	const lowConf = filteredFileResults.filter((f) => f.lowConfidence).length;

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onSuccess: (data) => {
			if (data.type === "cached") {
				queryClient.invalidateQueries({ queryKey: ["analysis", repository] });
				router.invalidate();
			} else {
				setPendingJobId(data.jobId);
			}
		},
		onError: (error) => {
			console.error("Reanalysis failed:", error);
		},
	});

	const jobQuery = useQuery({
		queryKey: ["analyzeJob", pendingJobId],
		queryFn: () => getJobStatus(pendingJobId!),
		enabled: pendingJobId !== null,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return !status || status === "pending" || status === "running" ? 2000 : false;
		},
	});

	useEffect(() => {
		if (!pendingJobId || !jobQuery.data) return;
		const { status } = jobQuery.data;
		if (status === "done") {
			setPendingJobId(null);
			queryClient.invalidateQueries({ queryKey: ["analysis", repository] });
			router.invalidate();
		} else if (status === "failed") {
			setPendingJobId(null);
		}
	}, [jobQuery.data, pendingJobId, queryClient, router, repository]);

	const isBusy = analyzeMutation.isPending || pendingJobId !== null;
	const currentStep =
		pendingJobId && jobQuery.data?.step
			? (STEP_LABELS[jobQuery.data.step] ?? "Analyzing...")
			: null;

	return (
		<div className="mx-auto w-full max-w-7xl space-y-2 p-4">
			<Card>
				<CardHeader>
					<H1>{repoName}</H1>
					<CardAction className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={isBusy}
							onClick={() => setShowConfirm(true)}
						>
							{isBusy ? (currentStep ?? "Analyzing...") : "Reanalyze"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link to="/repositories" />}
						>
							Select Other Repo
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="flex flex-wrap items-center gap-4">
					<Badge>Public</Badge>

					{/* ── Date range picker ─────────────────────────────── */}
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground font-fira-mono text-xs">Date range:</span>
						<input
							type="date"
							value={toDateInput(dateRange.start)}
							max={toDateInput(dateRange.end)}
							onChange={(e) => {
								const d = new Date(e.target.value);
								if (!Number.isNaN(d.getTime()))
									setDateRange((r) => ({ ...r, start: d }));
							}}
							className="border-input bg-background text-foreground font-fira-mono focus-visible:ring-ring h-7 rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1"
						/>
						<span className="text-muted-foreground font-fira-mono text-xs">→</span>
						<input
							type="date"
							value={toDateInput(dateRange.end)}
							min={toDateInput(dateRange.start)}
							onChange={(e) => {
								const d = new Date(e.target.value);
								if (!Number.isNaN(d.getTime()))
									setDateRange((r) => ({ ...r, end: d }));
							}}
							className="border-input bg-background text-foreground font-fira-mono focus-visible:ring-ring h-7 rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1"
						/>
						{!isDefaultRange && (
							<button
								type="button"
								title="Reset to last 6 months"
								onClick={() => setDateRange(defaultRange())}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								<RotateCcwIcon className="size-3.5" />
							</button>
						)}
						<span className="text-muted-foreground font-fira-mono text-[10px]">
							(default: last 6 months)
						</span>
					</div>
					{/* ──────────────────────────────────────────────────── */}

					{(analyzeMutation.isError || jobQuery.data?.status === "failed") && (
						<p className="text-destructive font-fira-mono text-xs">
							Reanalysis failed:{" "}
							{jobQuery.data?.status === "failed"
								? (jobQuery.data.error ?? "Unknown error")
								: analyzeMutation.error?.message}
						</p>
					)}
				</CardContent>
			</Card>

			<RepoSummaryCards
				totalFiles={filteredFileResults.length}
				risky={risky}
				acceptable={acceptable}
				lowConf={lowConf}
				selectedFilter={selectedFilter}
				onSelectFilter={setSelectedFilter}
			/>

			<Heatmap
				fileResults={filteredFileResults}
				threshold={analysis.threshold}
				repository={repoName}
				filter={selectedFilter}
				onFilterChange={setSelectedFilter}
			/>

			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
						<h2 className="font-fira-mono-bold text-foreground text-xl">
							Reanalyze {repoName}?
						</h2>
						<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed">
							This will re-run static analysis and sentiment extraction for commits from{" "}
							<strong>{toDateInput(dateRange.start)}</strong> to{" "}
							<strong>{toDateInput(dateRange.end)}</strong>.
						</p>
						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowConfirm(false)}
							>
								No
							</Button>
							<Button
								size="sm"
								disabled={isBusy}
								onClick={() => {
									setShowConfirm(false);
									const [owner, name] = repoName.split("/");
									const repoMatch = reposQuery.data?.repositories.find(
										(r) => r.fullName === repoName,
									);
									analyzeMutation.mutate({
										id: repoMatch ? String(repoMatch.id) : "",
										owner,
										repository: name,
										force: true,
										sinceDate: dateRange.start.toISOString(),
										untilDate: dateRange.end.toISOString(),
									});
								}}
							>
								Yes
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
