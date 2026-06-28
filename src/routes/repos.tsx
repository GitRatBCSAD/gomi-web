import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type JSX } from "react";

import { analyzeRepository, getRepositoriesQuery } from "@/lib/github/api";

export const Route = createFileRoute("/repos")({
	component: RouteComponent,
	beforeLoad: async () => {
		const token = localStorage.getItem("github_token");
		if (!token) {
			throw redirect({ to: "/" });
		}
	},
});

function RouteComponent(): JSX.Element {
	const [result, setResult] = useState<any>(null);

	const repositoriesQuery = useQuery(getRepositoriesQuery);

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onSuccess: (data) => setResult(data),
	});

	if (repositoriesQuery.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="p-8">
			<h1 className="mb-6 text-2xl font-bold">Your Repositories</h1>
			<ul className="space-y-2">
				{repositoriesQuery.data?.map((repo) => (
					<li key={repo.id} className="flex items-center gap-3">
						<a
							href={repo.htmlUrl}
							target="_blank"
							rel="noreferrer"
							className="text-blue-600 hover:underline"
						>
							{repo.fullName}
						</a>
						{repo.private && (
							<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
								private
							</span>
						)}
						<button
							type="button"
							onClick={() => {
								const [owner, name] = repo.fullName.split("/");
								analyzeMutation.mutate({
									owner: owner,
									repository: name,
								});
							}}
							disabled={analyzeMutation.isPending}
							className="rounded bg-gray-900 px-2 py-0.5 text-xs text-white hover:bg-gray-700 disabled:opacity-50"
						>
							{analyzeMutation.isPending ? "analyzing..." : "analyze"}
						</button>
					</li>
				))}
			</ul>

			{result && (
				<pre className="mt-8 overflow-auto rounded p-4 text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}
		</div>
	);
}
