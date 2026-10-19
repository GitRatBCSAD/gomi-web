import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LockIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import * as v from "valibot";

import { AnalysisLoadingScreen, stepLabel } from "@/components/analysis-loading-screen";
import type { UserProfile } from "@/components/navbar";
import { OnboardingTour, startOnboardingDriverTour } from "@/components/onboarding-tour";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { H1, H2, P } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BACKEND_URL, GITHUB_APP_NAME } from "@/lib/env";
import {
	analyzeRepository,
	getAnalysisQueryOptions,
	getAnalyzedRepositories,
	getJobStatus,
	getRepositories,
	getRepositoriesQuery,
} from "@/lib/github/api";
import { isAtRisk, RISK_BANDS, riskBand, riskScale } from "@/lib/interpret";

type RepoFilter = "all" | "unanalyzed" | "analyzed";

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

function RepoVerdict({ fullName }: { fullName: string }): JSX.Element {
	const { data } = useQuery(getAnalysisQueryOptions(fullName));
	if (!data) return <>Analyzed</>;
	const scale = riskScale(data.fileResults, data.threshold);
	const bands = data.fileResults.map((f) => riskBand(f.riskScore, f.lowConfidence, scale));
	const risky = bands.filter(isAtRisk).length;
	const veryHigh = bands.filter((b) => b === "very-high").length;
	if (risky === 0) return <>Analyzed · nothing above the warning line</>;
	return (
		<>
			Analyzed ·{" "}
			<span style={{ color: RISK_BANDS[veryHigh > 0 ? "very-high" : "high"].fg }}>
				{risky} {risky === 1 ? "file needs" : "files need"} attention
				{veryHigh > 0 && `, ${veryHigh} Very High`}
			</span>
		</>
	);
}

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
	const [jobError, setJobError] = useState<string | null>(null);
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
		onMutate: () => {
			setJobError(null);
		},
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
			setJobError(jobQuery.data.error ?? "Unknown error");
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
				<P className="text-muted-foreground animate-pulse text-sm tracking-widest uppercase">
					Loading repositories...
				</P>
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
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="space-y-1">
						<H1 variant="h2">Repositories</H1>
						<P className="text-muted-foreground">
							Welcome back, {userProfile?.githubUsername || "user"}. Pick a repository
							to scan or review.
						</P>
					</div>
					<TourTriggerButton onClick={() => startOnboardingDriverTour(notInstalled)} />
				</div>

				{showOnboarding && (
					<OnboardingTour notInstalled={notInstalled} onDone={dismissOnboarding} />
				)}

				{(analyzeMutation.isError || jobError) && (
					<P className="text-destructive w-full text-left text-sm">
						Analysis failed:{" "}
						{jobError ?? analyzeMutation.error?.message ?? "Unknown error"}
					</P>
				)}

				{notInstalled && (
					<div
						id="tour-install"
						className="border-primary/20 bg-background-900 flex w-full items-center justify-between gap-6 rounded-2xl border px-6 py-5 shadow-lg"
					>
						<div className="flex flex-col gap-1.5">
							<H2 variant="h4" className="text-base tracking-wide">
								GitHub App Installation Required
							</H2>
							<P className="text-muted-foreground max-w-xl text-sm leading-relaxed">
								To analyze your repositories, Gomi must be installed on your GitHub
								account or organization. Grant access to your preferred repositories
								to get started.
							</P>
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
					<div className="border-border/20 bg-dark-600/30 flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3">
						<P className="text-muted-foreground">
							Want to add or remove repository access?
						</P>
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
					className={`flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
				>
					<div
						id="tour-search"
						className="bg-background focus-within:ring-ring flex h-9 w-full items-center overflow-hidden rounded-md border px-3 focus-within:ring-1 sm:max-w-sm"
					>
						<input
							className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
							placeholder={
								notInstalled
									? "Install the GitHub App to search repositories"
									: "Search repositories"
							}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							disabled={notInstalled}
						/>
						<SearchIcon className="text-muted-foreground size-4" />
					</div>

					<Tabs value={filter} onValueChange={(v) => setFilter(v as RepoFilter)}>
						<TabsList>
							<TabsTrigger value="all">All</TabsTrigger>
							<TabsTrigger value="unanalyzed">Unanalyzed</TabsTrigger>
							<TabsTrigger value="analyzed">Analyzed</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<ul
					className={`divide-border bg-card w-full divide-y overflow-hidden rounded-lg border ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
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
						const busyLabel = currentStep ? stepLabel(currentStep) : "Analyzing...";
						const target = {
							id: String(repo.id),
							fullName: repo.fullName,
							owner,
							name,
						};

						return (
							<li
								key={repo.id}
								id={idx === 0 ? "tour-repos" : undefined}
								className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
							>
								<div className="min-w-0">
									<P className="flex items-center gap-2 truncate font-medium">
										<span>
											<span className="text-muted-foreground font-normal">
												{owner}/
											</span>
											{name}
										</span>
										{repo.private && (
											<LockIcon
												className="text-muted-foreground size-3.5"
												aria-label="Private"
											/>
										)}
									</P>
									<P className="text-muted-foreground flex items-center gap-1.5 text-sm">
										<span
											className="size-1.5 rounded-full"
											style={{
												backgroundColor: cached
													? "var(--primary)"
													: "var(--muted-foreground)",
											}}
										/>
										{cached ? (
											<RepoVerdict fullName={repo.fullName} />
										) : (
											"Not analyzed yet"
										)}
									</P>
								</div>
								<div className="flex items-center gap-2">
									{cached ? (
										<>
											<Button
												variant="ghost"
												size="sm"
												disabled={isBusy}
												onClick={() =>
													setConfirmAction({
														type: "reanalyze",
														repo: target,
													})
												}
											>
												{isPendingThisRepo ? busyLabel : "Reanalyze"}
											</Button>
											<Button
												size="sm"
												disabled={isBusy}
												onClick={() =>
													navigate({
														to: "/repositories/$repository",
														params: { repository: repo.fullName },
													})
												}
											>
												Review
											</Button>
										</>
									) : (
										<Button
											variant="outline"
											size="sm"
											disabled={isBusy}
											onClick={() =>
												setConfirmAction({ type: "analyze", repo: target })
											}
										>
											{isPendingThisRepo ? busyLabel : "Analyze"}
										</Button>
									)}
								</div>
							</li>
						);
					})}

					{repos.length === 0 && !notInstalled && (
						<li className="flex flex-col items-center justify-center gap-3 px-4 py-12">
							<P className="text-muted-foreground text-center text-sm">
								No repositories found.
							</P>
							{installationsCount !== null && installationsCount > 0 && (
								<>
									<P className="text-muted-foreground text-center text-sm">
										Your GitHub App is installed but no repositories are
										selected. Configure your access to add repositories.
									</P>
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
						</li>
					)}
				</ul>

				{confirmAction && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
						<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
							<H2 variant="h4">
								{confirmAction.type === "reanalyze" ? "Reanalyze" : "Analyze"}{" "}
								{confirmAction.repo.name}?
							</H2>
							<P className="text-muted-foreground text-sm leading-relaxed">
								{confirmAction.type === "reanalyze"
									? `Are you sure you want to reanalyze ${confirmAction.repo.fullName}? This will re-run static code analysis and sentiment extraction.`
									: `Are you sure you want to analyze ${confirmAction.repo.fullName}? This will fetch commit sentiment and run static analysis.`}
							</P>
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
