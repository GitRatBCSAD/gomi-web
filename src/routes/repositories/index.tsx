import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { GithubIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import * as v from "valibot";

import { AnalysisLoadingScreen } from "@/components/analysis-loading-screen";
import type { UserProfile } from "@/components/navbar";
import { OnboardingTour, startOnboardingDriverTour } from "@/components/onboarding-tour";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BACKEND_URL, GITHUB_APP_NAME } from "@/lib/env";
import {
	analyzeRepository,
	getAnalyzedRepositories,
	getJobStatus,
	getRepositories,
	getRepositoriesQuery,
} from "@/lib/github/api";

type RepoFilter = "all" | "unanalyzed" | "analyzed";

const STEP_LABELS: Record<string, string> = {
	queued: "Queued...",
	cloning: "Cloning...",
	extracting_git: "Reading history...",
	scanning_complexity: "Scanning...",
	scoring_files: "Scoring...",
};

function stepLabel(step: string): string {
	return STEP_LABELS[step] ?? "Analyzing...";
}

const authMeQueryOptions = {
	queryKey: ["authMe"],
	queryFn: async (): Promise<UserProfile | null> => {
		try {
			const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
			if (!res.ok) return null;
			const body = await res.json();
			return body.data;
		} catch {
			return null;
		}
	},
	staleTime: 60 * 1000,
};

const SearchSchema = v.object({
	code: v.optional(v.string()),
	setup: v.optional(v.union([v.string(), v.boolean()])),
	installation_id: v.optional(v.union([v.string(), v.number()])),
	setup_action: v.optional(v.string()),
});

export const Route = createFileRoute("/repositories/")({
	validateSearch: SearchSchema,
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const profile = await context.queryClient.ensureQueryData(authMeQueryOptions);
		if (!profile) throw redirect({ to: "/" });
	},
});

interface ConfirmAction {
	type: "analyze" | "reanalyze";
	repo: {
		id: string;
		fullName: string;
		owner: string;
		name: string;
	};
}

interface PendingJob {
	jobId: string;
	fullName: string;
}

const GUIDE_SEEN_KEY = "gomi:guide-seen";

function RouteComponent(): JSX.Element {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<RepoFilter>("all");
	const [showOnboarding, setShowOnboarding] = useState(
		() => localStorage.getItem(GUIDE_SEEN_KEY) !== "1",
	);

	function dismissOnboarding() {
		localStorage.setItem(GUIDE_SEEN_KEY, "1");
		setShowOnboarding(false);
	}

	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
	const [pendingJob, setPendingJob] = useState<PendingJob | null>(null);
	const navigate = useNavigate();
	const routeSearch = Route.useSearch();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (routeSearch.setup || routeSearch.installation_id) {
			queryClient.fetchQuery({
				queryKey: ["repository"],
				queryFn: () => getRepositories(true),
			});
			navigate({ to: "/repositories", replace: true });
		}
	}, [routeSearch.setup, routeSearch.installation_id, queryClient, navigate]);

	const repositoriesQuery = useQuery({
		...getRepositoriesQuery,
		refetchInterval: (query) =>
			(query.state.data?.installationsCount ?? null) === 0 ? 3000 : false,
	});

	const { data: userProfile } = useQuery(authMeQueryOptions);

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onSuccess: (data, variables) => {
			const fullName = `${variables.owner}/${variables.repository}`;
			if (data.type === "cached") {
				queryClient.invalidateQueries({ queryKey: ["analyzedRepositories"] });
				navigate({ to: "/repositories/$repository", params: { repository: fullName } });
			} else {
				setPendingJob({ jobId: data.jobId, fullName });
			}
		},
		onError: (error) => {
			console.error("Analysis failed:", error);
		},
	});

	const jobQuery = useQuery({
		queryKey: ["analyzeJob", pendingJob?.jobId],
		queryFn: () => getJobStatus(pendingJob!.jobId),
		enabled: pendingJob !== null,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return !status || status === "pending" || status === "running" ? 2000 : false;
		},
	});

	useEffect(() => {
		if (!pendingJob || !jobQuery.data) return;
		const { status } = jobQuery.data;
		if (status === "done") {
			queryClient.invalidateQueries({ queryKey: ["analyzedRepositories"] });
			navigate({
				to: "/repositories/$repository",
				params: { repository: pendingJob.fullName },
			});
			setPendingJob(null);
		} else if (status === "failed") {
			setPendingJob(null);
		}
	}, [jobQuery.data, pendingJob, navigate, queryClient]);

	const installationsCount = repositoriesQuery.data?.installationsCount ?? null;
	const notInstalled = installationsCount === 0;
	const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;

	const analyzedQuery = useQuery({
		queryKey: ["analyzedRepositories"],
		queryFn: getAnalyzedRepositories,
		staleTime: 60 * 1000,
	});
	const analyzedSet = new Set(analyzedQuery.data ?? []);

	const repos = (repositoriesQuery.data?.repositories ?? [])
		.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
		.filter((r) => {
			if (filter === "all") return true;
			const cached = analyzedSet.has(String(r.id));
			return filter === "analyzed" ? cached : !cached;
		})
		.sort((a, b) => {
			const cachedA = analyzedSet.has(String(a.id)) ? 1 : 0;
			const cachedB = analyzedSet.has(String(b.id)) ? 1 : 0;
			return cachedB - cachedA;
		});

	if (repositoriesQuery.isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-1 items-center justify-center">
				<p className="text-muted-foreground font-fira-mono animate-pulse text-sm tracking-widest uppercase">
					Loading repositories...
				</p>
			</div>
		);
	}

	return (
		<>
			<AnalysisLoadingScreen
				visible={pendingJob !== null}
				repoFullName={pendingJob?.fullName ?? ""}
				step={jobQuery.data?.step ?? "queued"}
				progress={jobQuery.data?.progress ?? 0}
				currentFile={jobQuery.data?.current_file}
			/>
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
				<div className="mb-2 flex w-full max-w-6xl flex-col items-center gap-1 text-center">
					<h1 className="font-fira-mono-bold text-foreground text-3xl font-bold">
						Welcome back,{" "}
						<span className="text-primary">
							{userProfile?.githubUsername || "user"}
						</span>
					</h1>
					<p className="font-fira-mono-bold text-muted-foreground text-2xs">
						Ready to scan?
					</p>
					<div className="mt-1">
						<TourTriggerButton
							onClick={() => startOnboardingDriverTour(notInstalled)}
						/>
					</div>
				</div>

				{showOnboarding && (
					<OnboardingTour notInstalled={notInstalled} onDone={dismissOnboarding} />
				)}

				{(analyzeMutation.isError || jobQuery.data?.status === "failed") && (
					<p className="text-destructive w-full max-w-6xl text-left text-sm">
						Analysis failed:{" "}
						{jobQuery.data?.status === "failed"
							? (jobQuery.data.error ?? "Unknown error")
							: (analyzeMutation.error?.message ?? "Unknown error")}
					</p>
				)}

				{notInstalled && (
					<div
						id="tour-install"
						className="border-primary/20 bg-background-900 flex w-full max-w-6xl items-center justify-between gap-6 rounded-2xl border px-6 py-5 shadow-lg"
					>
						<div className="flex flex-col gap-1.5">
							<p className="text-foreground font-fira-mono-bold text-base tracking-wide">
								GitHub App Installation Required
							</p>
							<p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
								To analyze your repositories, Gomi must be installed on your GitHub
								account or organization. Grant access to your preferred repositories
								to get started.
							</p>
						</div>
						<Button
							size="sm"
							nativeButton={false}
							render={
								<a href={installUrl} target="_blank" rel="noopener noreferrer" />
							}
						>
							Install Gomi App
						</Button>
					</div>
				)}

				{!notInstalled && installationsCount !== null && (
					<div className="border-border/20 bg-dark-600/30 flex w-full max-w-6xl items-center justify-between gap-4 rounded-xl border px-4 py-3">
						<p className="text-muted-foreground text-xs leading-normal">
							Want to add or remove repository access?
						</p>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={
								<a href={installUrl} target="_blank" rel="noopener noreferrer" />
							}
						>
							<SettingsIcon className="size-3.5" />
							Configure Access
						</Button>
					</div>
				)}

				<div
					className={`flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
				>
					<div
						id="tour-search"
						className="bg-background-900 flex w-full items-center overflow-hidden rounded-2xl border px-4 py-3 sm:max-w-sm"
					>
						<input
							className="text-muted-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-sm tracking-widest outline-none"
							placeholder={
								notInstalled
									? "Install the GitHub App to search repositories"
									: "Search Repository"
							}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							disabled={notInstalled}
						/>
						<SearchIcon className="text-muted-foreground size-5" />
					</div>

					<Tabs value={filter} onValueChange={(v) => setFilter(v as RepoFilter)}>
						<TabsList>
							<TabsTrigger value="all">All</TabsTrigger>
							<TabsTrigger value="unanalyzed">Unanalyzed</TabsTrigger>
							<TabsTrigger value="analyzed">Analyzed</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div
					className={`grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
				>
					{repos.map((repo, idx) => {
						const cached = analyzedSet.has(String(repo.id));
						const [owner, name] = repo.fullName.split("/");
						const isBusy = analyzeMutation.isPending || pendingJob !== null;
						const isPendingThisRepo =
							(analyzeMutation.isPending &&
								analyzeMutation.variables?.owner === owner &&
								analyzeMutation.variables?.repository === name) ||
							pendingJob?.fullName === repo.fullName;
						const currentStep =
							isPendingThisRepo && pendingJob?.fullName === repo.fullName
								? jobQuery.data?.step
								: undefined;

						return (
							<Card key={repo.id} id={idx === 0 ? "tour-repos" : undefined}>
								<CardHeader className="flex-row items-center justify-between">
									<GithubIcon className="text-foreground size-6 shrink-0" />
									<Badge variant={repo.private ? "outline" : "default"}>
										{repo.private ? "Private" : "Public"}
									</Badge>
								</CardHeader>
								<CardContent className="space-y-1">
									<CardTitle className="truncate text-base">
										{repo.name}
									</CardTitle>
									<p className="text-muted-foreground text-xs">
										{cached ? "Analyzed" : "No cached analysis found."}
									</p>
								</CardContent>
								<CardFooter className="gap-2">
									{cached ? (
										<>
											<Button
												disabled={isBusy}
												onClick={() => {
													navigate({
														to: "/repositories/$repository",
														params: { repository: repo.fullName },
													});
												}}
											>
												Review
											</Button>
											<Button
												variant="outline"
												disabled={isBusy}
												onClick={() => {
													setConfirmAction({
														type: "reanalyze",
														repo: {
															id: String(repo.id),
															fullName: repo.fullName,
															owner,
															name,
														},
													});
												}}
											>
												{isPendingThisRepo
													? currentStep
														? stepLabel(currentStep)
														: "Analyzing..."
													: "Reanalyze"}
											</Button>
										</>
									) : (
										<Button
											disabled={isBusy}
											onClick={() => {
												setConfirmAction({
													type: "analyze",
													repo: {
														id: String(repo.id),
														fullName: repo.fullName,
														owner,
														name,
													},
												});
											}}
										>
											{isPendingThisRepo
												? currentStep
													? stepLabel(currentStep)
													: "Analyzing..."
												: "Analyze"}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}

					{repos.length === 0 && !notInstalled && (
						<div className="col-span-full flex flex-col items-center justify-center gap-3 px-4 py-12">
							<p className="text-muted-foreground text-center text-sm">
								No repositories found.
							</p>
							{installationsCount !== null && installationsCount > 0 && (
								<>
									<p className="text-muted-foreground/60 text-center text-xs">
										Your GitHub App is installed but no repositories are
										selected. Configure your access to add repositories.
									</p>
									<Button
										variant="outline"
										size="sm"
										nativeButton={false}
										render={
											<a
												href={installUrl}
												target="_blank"
												rel="noopener noreferrer"
											/>
										}
									>
										<SettingsIcon className="size-3.5" />
										Configure Access
									</Button>
								</>
							)}
						</div>
					)}
				</div>

				{confirmAction && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
						<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
							<h2 className="font-fira-mono-bold text-foreground text-xl">
								{confirmAction.type === "reanalyze" ? "Reanalyze" : "Analyze"}{" "}
								{confirmAction.repo.name}?
							</h2>
							<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed">
								{confirmAction.type === "reanalyze"
									? `Are you sure you want to reanalyze ${confirmAction.repo.fullName}? This will re-run static code analysis and sentiment extraction.`
									: `Are you sure you want to analyze ${confirmAction.repo.fullName}? This will fetch commit sentiment and run static analysis.`}
							</p>
							<div className="flex justify-end gap-3 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setConfirmAction(null)}
								>
									No
								</Button>
								<Button
									size="sm"
									disabled={analyzeMutation.isPending}
									onClick={() => {
										const { id, owner, name } = confirmAction.repo;
										const isReanalyze = confirmAction.type === "reanalyze";
										setConfirmAction(null);
										analyzeMutation.mutate({
											id,
											owner,
											repository: name,
											...(isReanalyze ? { force: true } : {}),
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
		</>
	);
}
