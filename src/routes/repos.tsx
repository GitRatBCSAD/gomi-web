import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/repos")({ component: Repos });

type Repository = {
	id: number;
	name: string;
	full_name: string;
	private: boolean;
	html_url: string;
};

async function getRepositories(): Promise<Repository[]> {
	const token = localStorage.getItem("github_token");
	const res = await fetch("http://localhost:3002/repos", {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.json();
}

function Repos() {
	const navigate = useNavigate();
	const token = localStorage.getItem("github_token");

	const repositoriesQuery = useQuery({
		queryKey: ["repos"],
		queryFn: getRepositories,
		enabled: !!token,
		staleTime: 5 * 60 * 1000,
	});
	const repos = repositoriesQuery.data;

	if (!token) {
		navigate({ to: "/" });
		return null;
	}

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
				{repos?.map((repo) => (
					<li key={repo.id} className="flex items-center gap-2">
						<a
							href={repo.html_url}
							target="_blank"
							rel="noreferrer"
							className="text-blue-600 hover:underline"
						>
							{repo.full_name}
						</a>
						{repo.private && (
							<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
								private
							</span>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
