import { Tour, useTour, type TourStepDetails } from "@ark-ui/react";
import { HelpCircleIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, type JSX } from "react";
import { createPortal } from "react-dom";

const WelcomeBody = (): JSX.Element => (
	<div className="flex flex-col gap-3">
		<p>
			Welcome to the Repository Risk Overview. Gomi scans static complexity and commit sentiment
			to highlight high-risk files across your codebase.
		</p>
	</div>
);

const DoneBody = (): JSX.Element => (
	<div className="flex flex-col gap-3">
		<p>
			Click any tile on the heatmap to open the file's deep-dive view—including Risk Drift, SHAP
			breakdowns, and Root Cause Analysis.
		</p>
	</div>
);

function buildSteps(): TourStepDetails[] {
	const welcome: TourStepDetails = {
		id: "welcome",
		type: "dialog",
		title: "Repository Risk Overview",
		description: <WelcomeBody />,
		actions: [
			{ label: "Skip", action: "dismiss" },
			{ label: "Next", action: "next" },
		],
	};

	const header: TourStepDetails = {
		id: "header",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-repo-header"),
		placement: "bottom",
		title: "Header & Reanalyze",
		description:
			"View your repository's visibility status and trigger a reanalysis whenever major changes are pushed.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	const summary: TourStepDetails = {
		id: "summary",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-repo-summary"),
		placement: "bottom",
		title: "Risk Distribution Cards",
		description:
			"Filter files instantly by clicking Risky, Acceptable, or Low Confidence counts.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	const heatmap: TourStepDetails = {
		id: "heatmap",
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>("#tour-repo-heatmap"),
		placement: "top",
		title: "Interactive File Heatmap",
		description:
			"Tile size represents code complexity; color represents risk score. Use the toolbar above to search or sort files.",
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Next", action: "next" },
		],
	};

	const done: TourStepDetails = {
		id: "done",
		type: "dialog",
		title: "File Deep-Dive",
		description: <DoneBody />,
		actions: [
			{ label: "Back", action: "prev" },
			{ label: "Done", action: "dismiss" },
		],
	};

	return [welcome, header, summary, heatmap, done];
}

const ENDED = ["completed", "dismissed", "skipped"];

export function RepoDetailTour({
	onDone,
}: {
	onDone: () => void;
}): JSX.Element | null {
	const steps = useMemo(() => buildSteps(), []);
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

export function TourTriggerButton({ onClick }: { onClick: () => void }): JSX.Element {
	return (
		<button
			type="button"
			onClick={onClick}
			className="border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
		>
			<HelpCircleIcon className="size-3.5" />
			<span>Tour</span>
		</button>
	);
}
