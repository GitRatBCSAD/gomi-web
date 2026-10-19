import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type JSX } from "react";
import * as v from "valibot";

import { BranchSelect } from "@/components/branch-select";
import { RepoDriverTour, startRepoDriverTour } from "@/components/repo-driver-tour";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { H1, H2, P } from "@/components/typography";
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

const REPO_TOUR_KEY = "gomi:repo_detail_tour_seen";

const STEP_LABELS: Record<string, string> = {
	queued: "Queued...",
	cloning: "Cloning...",
	extracting_git: "Reading history...",
	scanning_complexity: "Scanning...",
	scoring_files: "Scoring...",
};

export const Route = createFileRoute("/repositories/$repository/")({
	validateSearch: v.object({ branch: v.optional(v.string()) }),
	loaderDeps: ({ search }) => ({ branch: search.branch }),
	component: RouteComponent,
	loader: async ({ params, deps, context }) => {
		try {
			return await context.queryClient.ensureQueryData(
				getAnalysisQueryOptions(params.repository, deps.branch),
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error("[loader] failed to load analysis for", params.repository, e);
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
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const [confirmBranch, setConfirmBranch] = useState<string | null>(null);
	const [jobBranch, setJobBranch] = useState<string | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "risky" | "acceptable" | "low-conf"
	>("all");
	const [pendingJobId, setPendingJobId] = useState<string | null>(null);
	const [jobError, setJobError] = useState<string | null>(null);
	const [showTour, setShowTour] = useState(() => !localStorage.getItem(REPO_TOUR_KEY));

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
		onMutate: () => {
			setJobError(null);
		},
		onSuccess: (data, variables) => {
			if (data.type === "cached") {
				showBranch(variables.branch ?? analysis.branch);
			} else {
				setJobBranch(variables.branch ?? analysis.branch);
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
			showBranch(jobBranch ?? analysis.branch);
		} else if (status === "failed") {
			setJobError(jobQuery.data.error ?? "Unknown error");
			setPendingJobId(null);
		}
	}, [jobQuery.data, pendingJobId]);

	function showBranch(branch: string) {
		queryClient.invalidateQueries({ queryKey: ["analysis", repository] });
		queryClient.invalidateQueries({ queryKey: ["branches", repository] });
		navigate({ search: { branch } });
	}

	const isBusy = analyzeMutation.isPending || pendingJobId !== null;
	const isNewBranch = confirmBranch !== null && confirmBranch !== analysis.branch;
	const currentStep =
		pendingJobId && jobQuery.data?.step
			? (STEP_LABELS[jobQuery.data.step] ?? "Analyzing...")
			: null;

	const handleDismissTour = () => {
		localStorage.setItem(REPO_TOUR_KEY, "1");
		setShowTour(false);
	};

	const handleStartTour = () => {
		startRepoDriverTour(handleDismissTour);
	};

	return (
		<div className="mx-auto w-full max-w-7xl space-y-2 p-4">
			{showTour && <RepoDriverTour onDone={handleDismissTour} />}

			<Card>
				<CardHeader id="tour-repo-header">
					<H1>{repoName}</H1>
					<CardAction className="flex items-center gap-2">
						<TourTriggerButton onClick={handleStartTour} />
						<BranchSelect
							fullName={repoName}
							value={analysis.branch}
							disabled={isBusy}
							onChange={(branch, analyzed) =>
								analyzed
									? navigate({ search: { branch } })
									: setConfirmBranch(branch)
							}
						/>
						<Button
							variant="outline"
							size="sm"
							disabled={isBusy}
							onClick={() => setConfirmBranch(analysis.branch)}
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
					<P className="text-muted-foreground text-sm">
						Showing the{" "}
						<span className="text-foreground font-medium">{analysis.branch}</span>{" "}
						branch.
					</P>
					{(analyzeMutation.isError || jobError) && (
						<P className="text-destructive text-sm">
							Reanalysis failed:{" "}
							{jobError ?? analyzeMutation.error?.message ?? "Unknown error"}
						</P>
					)}
				</CardContent>
			</Card>

			<div id="tour-repo-summary">
				<RepoSummaryCards
					totalFiles={analysis.fileResults.length}
					risky={risky}
					acceptable={acceptable}
					lowConf={lowConf}
					selectedFilter={selectedFilter}
					onSelectFilter={setSelectedFilter}
				/>
			</div>

			<div id="tour-repo-heatmap">
				<Heatmap
					fileResults={analysis.fileResults}
					threshold={analysis.threshold}
					repository={repoName}
					branch={analysis.branch}
					filter={selectedFilter}
					onFilterChange={setSelectedFilter}
				/>
			</div>

			{confirmBranch !== null && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
						<H2 variant="h4">
							{isNewBranch ? "Analyze" : "Reanalyze"} {repoName}?
						</H2>
						<P className="text-muted-foreground text-sm leading-relaxed">
							{isNewBranch
								? `The ${confirmBranch} branch has not been analyzed yet. Analyze it now? This runs static code analysis and sentiment extraction on that branch.`
								: `Are you sure you want to reanalyze the ${confirmBranch} branch? This will re-run static code analysis and sentiment extraction.`}
						</P>
						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setConfirmBranch(null)}
							>
								No
							</Button>
							<Button
								size="sm"
								disabled={isBusy}
								onClick={() => {
									const branch = confirmBranch;
									setConfirmBranch(null);
									const [owner, name] = repoName.split("/");
									const repoMatch = reposQuery.data?.repositories.find(
										(r) => r.fullName === repoName,
									);
									analyzeMutation.mutate({
										id: repoMatch ? String(repoMatch.id) : "",
										owner,
										repository: name,
										branch,
										force: !isNewBranch,
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
