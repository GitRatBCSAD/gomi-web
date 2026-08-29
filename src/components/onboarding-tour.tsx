import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, type JSX } from "react";

export function startOnboardingDriverTour(notInstalled: boolean, onDone?: () => void) {
	const steps: DriveStep[] = notInstalled
		? [
				{
					popover: {
						title: "Welcome to Gomi",
						description:
							"Gomi turns your repository into a heatmap that flags risky files before a bug is filed. Tile size is code weight; color is risk score.",
					},
				},
				{
					element: "#tour-install",
					popover: {
						title: "Connect a repository",
						description:
							"Install the GitHub App to grant read-only access to the repositories you want to watch. Gomi never writes to your code.",
						side: "bottom",
						align: "start",
					},
				},
				{
					element: "#tour-guide",
					popover: {
						title: "Guide & Glossary",
						description:
							"The field guide explains how to read the heatmap and defines every metric term. Open it anytime.",
						side: "bottom",
						align: "start",
					},
				},
				{
					popover: {
						title: "You're Set!",
						description:
							"Every metric in a file's analysis has a helpful definition. Enjoy exploring your repositories!",
					},
				},
			]
		: [
				{
					popover: {
						title: "Welcome to Gomi",
						description:
							"Gomi turns your repository into a heatmap that flags risky files before a bug is filed. Tile size is code weight; color is risk score.",
					},
				},
				{
					element: "#tour-search",
					popover: {
						title: "Find a repository",
						description: "Search across every repository you've connected to Gomi.",
						side: "bottom",
						align: "start",
					},
				},
				{
					element: "#tour-repos",
					popover: {
						title: "Analyze a repository",
						description:
							"Pick a repo and hit Analyze. Gomi reads recent commit history (read-only) and caches the result for instant access.",
						side: "top",
						align: "start",
					},
				},
				{
					element: "#tour-guide",
					popover: {
						title: "Guide & Glossary",
						description:
							"The field guide explains how to read the heatmap and defines every metric term. Open it anytime.",
						side: "bottom",
						align: "start",
					},
				},
				{
					popover: {
						title: "You're Set!",
						description:
							"Every metric in a file's analysis has a helpful definition. Enjoy exploring your repositories!",
					},
				},
			];

	const driverObj = driver({
		showProgress: true,
		animate: true,
		overlayColor: "rgba(0, 0, 0, 0.7)",
		stagePadding: 8,
		stageRadius: 10,
		onDestroyed: () => {
			onDone?.();
		},
		steps,
	});

	driverObj.drive();
}

export function OnboardingTour({
	notInstalled,
	onDone,
}: {
	notInstalled: boolean;
	onDone: () => void;
}): JSX.Element | null {
	useEffect(() => {
		startOnboardingDriverTour(notInstalled, onDone);
	}, [notInstalled]);

	return null;
}
