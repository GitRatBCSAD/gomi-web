import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
	const redirectUri = "http://localhost:3000/github/callback";
	const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

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
