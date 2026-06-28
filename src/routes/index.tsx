import { createFileRoute } from "@tanstack/react-router";

import { CLIENT_URL, GITHUB_CLIENT_ID } from "@/lib/env";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const redirectUri = `${CLIENT_URL}/github/callback`;
	const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;

	return (
		<div className="flex min-h-screen items-center justify-center">
			<a
				href={authUrl}
				className="rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-700"
			>
				Login with GitHub
			</a>
		</div>
	);
}
