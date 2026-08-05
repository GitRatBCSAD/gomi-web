import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { GithubIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import * as v from "valibot";

import type { UserProfile } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { BACKEND_URL, GITHUB_APP_NAME } from "@/lib/env";
import { analyzeRepository, getRepositories, getRepositoriesQuery } from "@/lib/github/api";
import { loadAnalysis, saveAnalysis } from "@/lib/github/model";

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

function RouteComponent(): JSX.Element {
	const [search, setSearch] = useState("");
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
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
			saveAnalysis(fullName, data);
			navigate({ to: "/repositories/$repository", params: { repository: fullName } });
		},
		onError: (error) => {
			console.error("Analysis failed:", error);
		},
	});

	const installationsCount = repositoriesQuery.data?.installationsCount ?? null;
	const notInstalled = installationsCount === 0;
	const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;

	const repos = (repositoriesQuery.data?.repositories ?? [])
		.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) => {
			const cachedA = loadAnalysis(a.fullName) != null ? 1 : 0;
			const cachedB = loadAnalysis(b.fullName) != null ? 1 : 0;
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
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
			<div className="mb-2 flex w-full max-w-3xl flex-col items-center gap-1 text-center">
				<h1 className="font-fira-mono-bold text-3xl font-bold text-white">
					Welcome back,{" "}
					<span className="text-primary">{userProfile?.githubUsername || "user"}</span>
				</h1>
				<p className="font-fira-mono-bold text-2xs text-gray-400">Ready to scan?</p>
			</div>

			{analyzeMutation.isError && (
				<p className="text-destructive w-full max-w-3xl text-left text-sm">
					Analysis failed: {analyzeMutation.error?.message ?? "Unknown error"}
				</p>
			)}

			{notInstalled && (
				<div className="border-primary/20 bg-background-900 flex w-full max-w-3xl items-center justify-between gap-6 rounded-2xl border px-6 py-5 shadow-lg">
					<div className="flex flex-col gap-1.5">
						<p className="text-foreground font-fira-mono-bold text-base tracking-wide">
							GitHub App Installation Required
						</p>
						<p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
							To analyze your repositories, Gomi must be installed on your GitHub
							account or organization. Grant access to your preferred repositories to
							get started.
						</p>
					</div>
					<Button
						size="sm"
						nativeButton={false}
						render={<a href={installUrl} target="_blank" rel="noopener noreferrer" />}
					>
						Install Gomi App
					</Button>
				</div>
			)}

			{!notInstalled && installationsCount !== null && (
				<div className="border-border/20 bg-dark-600/30 flex w-full max-w-3xl items-center justify-between gap-4 rounded-xl border px-4 py-3">
					<p className="text-muted-foreground text-xs leading-normal">
						Want to add or remove repository access?
					</p>
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={<a href={installUrl} target="_blank" rel="noopener noreferrer" />}
					>
						<SettingsIcon className="size-3.5" />
						Configure Access
					</Button>
				</div>
			)}

			<div
				className={`bg-background-900 w-full max-w-3xl overflow-hidden rounded-2xl border ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
			>
				<div className="flex items-center px-4 py-4">
					<input
						className="text-muted-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-sm tracking-widest outline-none"
						placeholder={
							notInstalled
								? "Install the GitHub App to search repositories"
								: "Search"
						}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						disabled={notInstalled}
					/>
					<SearchIcon className="text-muted-foreground size-5" />
				</div>
			</div>

			<div
				className={`bg-background-900 w-full max-w-3xl overflow-hidden rounded-2xl border ${notInstalled ? "pointer-events-none opacity-40" : ""}`}
			>
				<div className="h-120 overflow-y-auto">
					{repos.map((repo) => (
						<div
							key={repo.id}
							className="border-border flex items-center gap-4 border-b px-4 py-6"
						>
							<GithubIcon className="text-foreground size-8 shrink-0" />
							<span className="text-foreground flex-1 text-lg font-medium">
								{repo.name}
							</span>
							{(() => {
								const cached = loadAnalysis(repo.fullName);
								const [owner, name] = repo.fullName.split("/");
								const isPendingThisRepo =
									analyzeMutation.isPending &&
									analyzeMutation.variables?.owner === owner &&
									analyzeMutation.variables?.repository === name;

								return (
									<div className="flex items-center gap-2">
										{cached ? (
											<>
												<Button
													disabled={analyzeMutation.isPending}
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
													disabled={analyzeMutation.isPending}
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
													{isPendingThisRepo ? "Reanalyzing..." : "Reanalyze"}
												</Button>
											</>
										) : (
											<Button
												disabled={analyzeMutation.isPending}
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
												{isPendingThisRepo ? "Analyzing..." : "Analyze"}
											</Button>
										)}
									</div>
								);
							})()}
						</div>
					))}

					{repos.length === 0 && !notInstalled && (
						<div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
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
	);
}

