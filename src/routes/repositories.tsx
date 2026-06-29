import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { GithubIcon, SearchIcon } from "lucide-react";
import { useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/env";
import { analyzeRepository, getRepositoriesQuery } from "@/lib/github/api";

export const Route = createFileRoute("/repositories")({
	component: RouteComponent,
	beforeLoad: async () => {
		const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
		if (!res.ok) throw redirect({ to: "/" });
	},
});

function RouteComponent(): JSX.Element {
	const [search, setSearch] = useState("");
	const [result, setResult] = useState<unknown>(null);

	const repositoriesQuery = useQuery(getRepositoriesQuery);

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onSuccess: (data) => setResult(data),
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
			<div className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-background-900">
				<div className="flex items-center px-4 py-4">
					<input
						className="flex-1 bg-transparent text-sm tracking-widest text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
						placeholder="Search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<SearchIcon className="size-5 text-muted-foreground" />
				</div>
			</div>

			<div className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-background-900">
				<div className="h-120 overflow-y-auto">
					{repos.map((repo) => (
						<div
							key={repo.id}
							className="flex items-center gap-4 border-b border-border px-4 py-6"
						>
							<GithubIcon className="size-8 shrink-0 text-foreground" />
							<span className="flex-1 text-lg font-medium text-foreground">
								{repo.name}
							</span>
							<Button
								disabled={analyzeMutation.isPending}
								onClick={() => {
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

			{result && (
				<pre className="mt-8 w-full max-w-3xl overflow-auto rounded p-4 text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}
		</div>
	);
}
