import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type JSX } from "react";

import { stepLabel } from "@/components/analysis-loading-screen";
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
import { riskScale } from "@/lib/interpret";

import { Heatmap } from "./-components/repo-overview/heatmap";
import { RepoSummaryCards } from "./-components/repo-overview/repo-summary-cards";

const REPO_TOUR_KEY = "gomi:repo_detail_tour_seen";

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

	const scale = useMemo(
		() => riskScale(analysis.fileResults, analysis.threshold),
		[analysis.fileResults, analysis.threshold],
	);

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onMutate: () => {
			setJobError(null);
		},
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
			setJobError(jobQuery.data.error ?? "Unknown error");
			setPendingJobId(null);
		}
	}, [jobQuery.data, pendingJobId, queryClient, router, repository]);

	const isBusy = analyzeMutation.isPending || pendingJobId !== null;
	const currentStep = pendingJobId && jobQuery.data?.step ? stepLabel(jobQuery.data.step) : null;

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
					<P className="text-muted-foreground text-sm">
						Based on the last 6 months of changes on{" "}
						<span className="font-fira-mono">{analysis.defaultBranch}</span>.
					</P>
					{(analyzeMutation.isError || jobError) && (
						<P className="text-destructive text-sm">
							Could not re-analyze this repository:{" "}
							{jobError ?? analyzeMutation.error?.message ?? "Unknown error"}
						</P>
					)}
				</CardContent>
			</Card>

			<div id="tour-repo-summary">
				<RepoSummaryCards
					fileResults={analysis.fileResults}
					scale={scale}
					selectedFilter={selectedFilter}
					onSelectFilter={setSelectedFilter}
				/>
			</div>

			<div id="tour-repo-heatmap">
				<Heatmap
					fileResults={analysis.fileResults}
					scale={scale}
					repository={repoName}
					filter={selectedFilter}
					onFilterChange={setSelectedFilter}
				/>
			</div>

			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
						<H2 variant="h4">Reanalyze {repoName}?</H2>
						<P className="text-muted-foreground text-sm leading-relaxed">
							Are you sure you want to reanalyze {repoName}? Gomi will re-read the
							change history, re-measure code complexity and re-score every file.
						</P>
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
