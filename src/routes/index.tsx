import { createFileRoute } from "@tanstack/react-router";

import { H1 } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { CLIENT_URL, GITHUB_CLIENT_ID } from "@/lib/env";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const redirectUri = `${CLIENT_URL}/github/callback`;
	const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;

	return (
		<div className="mx-auto flex flex-1 max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
			<H1>Detect Debt Before It Breaks You</H1>
			<Button render={<a href={authUrl} />}>Login with GitHub</Button>
		</div>
	);
}
