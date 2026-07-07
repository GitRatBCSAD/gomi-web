import { createFileRoute, redirect } from "@tanstack/react-router";
import { GithubIcon } from "lucide-react";

import { BACKEND_URL, CLIENT_URL, GITHUB_CLIENT_ID } from "@/lib/env";

export const Route = createFileRoute("/")({
	component: Home,
	beforeLoad: async () => {
		const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
		if (res.ok) throw redirect({ to: "/repositories" });
	},
});

function Home() {
	const redirectUri = `${CLIENT_URL}/github/callback`;
	const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;

	return (
		<div className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center gap-5 px-6 py-8 text-center min-h-[calc(100vh-4.5rem)]">
			<span className="font-fira-mono text-[0.8125rem] tracking-wider text-primary ">
				GOMI &bull; Technical Debt Heatmap
			</span>
			<h1 className="font-fira-mono-bold text-[clamp(2rem,_5vw,_3.25rem)] font-bold leading-tight text-white m-0">
				Detect <span className="text-primary">Debt</span> Before It Breaks You
			</h1>
			<p className="font-fira-mono text-[0.9375rem] leading-relaxed text-gray-400 max-w-4xl m-0">
				Analyze commit sentiment to uncover emotionally volatile code &mdash; the kind that breaks in production.
			</p>
			<a
				href={authUrl}
				className="inline-flex items-center justify-center gap-2.5 w-full max-w-[52rem] py-3.5 px-8 mt-2 bg-primary text-black font-fira-mono-bold text-base font-bold no-underline rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(0,233,151,0.35)]"
			>
				<GithubIcon className="size-5 shrink-0" />
				<span>Install Now</span>
			</a>
		</div>
	);
}
