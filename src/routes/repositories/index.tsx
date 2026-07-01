import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { GithubIcon, SearchIcon } from "lucide-react";
import { useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/env";
import { analyzeRepository, getRepositoriesQuery } from "@/lib/github/api";
import { loadAnalysis, saveAnalysis } from "@/lib/github/model";

export const Route = createFileRoute("/repositories/")({
	component: RouteComponent,
	beforeLoad: async () => {
		const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
		if (!res.ok) throw redirect({ to: "/" });
	},
});

function RouteComponent(): JSX.Element {
	const [search, setSearch] = useState("");
	const navigate = useNavigate();

	const repositoriesQuery = useQuery(getRepositoriesQuery);

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

	const repos = (repositoriesQuery.data ?? []).filter((r) =>
		r.name.toLowerCase().includes(search.toLowerCase()),
	);

	if (repositoriesQuery.isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
			{analyzeMutation.isError && (
				<p className="text-destructive text-sm">
					Analysis failed: {analyzeMutation.error?.message ?? "Unknown error"}
				</p>
			)}
			<div className="bg-background-900 w-full max-w-3xl overflow-hidden rounded-2xl border">
				<div className="flex items-center px-4 py-4">
					<input
						className="text-muted-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-sm tracking-widest outline-none"
						placeholder="Search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<SearchIcon className="text-muted-foreground size-5" />
				</div>
			</div>

			<div className="bg-background-900 w-full max-w-3xl overflow-hidden rounded-2xl border">
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
							<Button
								disabled={analyzeMutation.isPending}
								onClick={() => {
									const cached = loadAnalysis(repo.fullName);
									if (cached) {
										navigate({
											to: "/repositories/$repository",
											params: { repository: repo.fullName },
										});
										return;
									}
									const [owner, name] = repo.fullName.split("/");
									analyzeMutation.mutate({ owner, repository: name });
								}}
							>
								{analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
							</Button>
						</div>
					))}

					{repos.length === 0 && (
						<p className="text-muted-foreground px-4 py-8 text-center">
							No repositories found.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
