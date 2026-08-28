import { Tour, useTour, type TourStepDetails } from "@ark-ui/react";
import { XIcon } from "lucide-react";
import { useEffect, useMemo, type JSX } from "react";
import { createPortal } from "react-dom";

import { HeatmapLegendPreview, RiskLegendRows } from "@/components/heatmap-legend-preview";

const WelcomeBody = (): JSX.Element => (
	<div className="flex flex-col gap-3">
		<div className="flex justify-center">
			<HeatmapLegendPreview />
		</div>
		<p>
			Gomi turns your repository into a heatmap that flags risky files before a bug is filed.
			Tile size is how heavy the code is; color is how risky. It reads both your code and how
			your team writes about it in commit messages.
		</p>
	</div>
);

const DoneBody = (): JSX.Element => (
	<div className="flex flex-col gap-3">
		<RiskLegendRows />
		<p>
			Every metric in a file's analysis has an ⓘ — hover it for a plain-language definition.
			The full guide lives in the top nav whenever you need it.
		</p>
	</div>
);

function buildSteps(notInstalled: boolean): TourStepDetails[] {
	const welcome: TourStepDetails = {
		id: "welcome",
		type: "dialog",
		title: "Welcome to Gomi",
		description: <WelcomeBody />,
		actions: [
			{ label: "Skip", action: "dismiss" },
			{ label: "Next", action: "next" },
		],
	};

	const guide: TourStepDetails = {
		id: "guide",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-guide"),
		placement: "bottom",
		title: "Guide & glossary",
		description:
			"The field guide explains how to read the heatmap and defines every term. Open it anytime.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	const done: TourStepDetails = {
		id: "done",
		type: "dialog",
		title: "You're set",
		description: <DoneBody />,
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Done", action: "dismiss" },
		],
	};

	if (notInstalled) {
		const install: TourStepDetails = {
			id: "install",
			type: "tooltip",
			target: () => document.querySelector<HTMLElement>("#tour-install"),
			placement: "bottom",
			title: "Connect a repository",
			description:
				"Install the GitHub App to grant read-only access to the repos you want to watch. Gomi never writes to your code.",
			actions: [
				{ label: "Back", action: "prev" },
				{ label: "Next", action: "next" },
			],
		};
		return [welcome, install, guide, done];
	}

	const search: TourStepDetails = {
		id: "search",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-search"),
		placement: "bottom",
		title: "Find a repository",
		description: "Search across every repo you've connected to Gomi.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	const repos: TourStepDetails = {
		id: "repos",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-repos"),
		placement: "top",
		title: "Analyze a repository",
		description:
			"Pick a repo and hit Analyze. Gomi reads the last six months of history — read-only — and caches the result so you can reopen it instantly.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	return [welcome, search, repos, guide, done];
}

const ENDED = ["completed", "dismissed", "skipped"];

export function OnboardingTour({
	notInstalled,
	onDone,
}: {
	notInstalled: boolean;
	onDone: () => void;
}): JSX.Element | null {
	const steps = useMemo(() => buildSteps(notInstalled), [notInstalled]);
	const tour = useTour({
		steps,
		closeOnInteractOutside: false,
		onStatusChange: (details) => {
			if (ENDED.includes(details.status)) onDone();
		},
	});

	useEffect(() => {
		tour.start();
	}, []);

	if (!tour.open) return null;

	return createPortal(
		<Tour.Root tour={tour}>
			<Tour.Backdrop className="pointer-events-none fixed inset-0 z-[999] bg-black/70" />
			<Tour.Spotlight className="ring-primary/60 rounded-lg ring-2" />
			<Tour.Positioner
				className={
					tour.step?.type === "dialog"
						? "fixed inset-0 z-[1000] flex items-center justify-center p-4"
						: "z-[1000]"
				}
			>
				<Tour.Content className="bg-background-900 border-border/40 font-fira-mono text-muted-foreground relative flex w-[min(92vw,26rem)] flex-col gap-3 rounded-2xl border p-6 text-sm leading-relaxed shadow-2xl">
					<Tour.Title className="font-fira-mono-bold text-primary pr-6 text-lg">
						{tour.step?.title}
					</Tour.Title>
					<Tour.Description className="text-muted-foreground text-sm leading-relaxed">
						{tour.step?.description}
					</Tour.Description>

					<div className="mt-1 flex items-center justify-between gap-3">
						<Tour.ProgressText className="text-muted-foreground/60 text-xs tabular-nums" />
						<div className="flex items-center gap-2">
							{tour.step?.actions?.map((a) => (
								<Tour.ActionTrigger
									key={a.label}
									action={a}
									className={
										a.action === "next"
											? "bg-primary hover:bg-primary/90 cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold text-black transition-colors"
											: "border-border/50 text-muted-foreground hover:text-foreground cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors"
									}
								/>
							))}
						</div>
					</div>

					<Tour.CloseTrigger
						aria-label="Close tour"
						className="text-muted-foreground hover:text-foreground absolute top-4 right-4 cursor-pointer transition-colors"
					>
						<XIcon className="size-4" />
					</Tour.CloseTrigger>

					{tour.step?.type === "tooltip" && (
						<Tour.Arrow>
							<Tour.ArrowTip className="border-border/40 border" />
						</Tour.Arrow>
					)}
				</Tour.Content>
			</Tour.Positioner>
		</Tour.Root>,
		document.body,
	);
}
