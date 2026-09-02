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
		<div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-6 py-8 text-center">
			<div
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--primary) 25%, transparent) 100%)",
				}}
			/>
			<h1 className="font-fira-mono-bold text-foreground m-0 text-[clamp(2rem,_5vw,_3.25rem)] leading-tight font-bold">
				Detect <span className="text-primary">Debt</span> Before It Breaks You
			</h1>
			<p className="font-fira-mono text-muted-foreground m-0 max-w-4xl text-[0.9375rem] leading-relaxed">
				Analyze commit sentiment to uncover emotionally volatile code &mdash; the kind that
				breaks in production.
			</p>
			<a
				href={authUrl}
				className="bg-primary font-fira-mono-bold hover:bg-primary/90 text-primary-foreground mt-2 inline-flex w-full max-w-[52rem] cursor-pointer items-center justify-center gap-2.5 rounded-lg px-8 py-3.5 text-base font-bold no-underline transition-all duration-200"
			>
				<GithubIcon className="size-5 shrink-0" />
				<span>Install Now</span>
			</a>
		</div>
	);
}
