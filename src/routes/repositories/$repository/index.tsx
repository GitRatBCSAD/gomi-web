import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type JSX } from "react";

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

	const reposQuery = useQuery(getRepositoriesQuery);

	const repoName = analysis.repoUrl
		.replace(/\.git$/, "")
		.split("/")
		.slice(-2)
		.join("/");

	const risky = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore >= analysis.threshold,
	).length;
	const acceptable = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore < analysis.threshold,
	).length;
	const lowConf = analysis.fileResults.filter((f) => f.lowConfidence).length;

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
	const currentStep = pendingJobId && jobQuery.data?.step
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

				<CardContent className="flex items-center gap-4">
					<Badge>Public</Badge>
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
				totalFiles={analysis.fileResults.length}
				risky={risky}
				acceptable={acceptable}
				lowConf={lowConf}
				selectedFilter={selectedFilter}
				onSelectFilter={setSelectedFilter}
			/>

			<Heatmap
				fileResults={analysis.fileResults}
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
							Are you sure you want to reanalyze {repoName}? This will re-run static code analysis and sentiment extraction.
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
