export type GlossaryEntry = {
	definition: string;
	learnMoreUrl: string;
};

export const GLOSSARY = {
	cyclomaticComplexity: {
		definition:
			"A count of the number of independent paths through a function. Higher values mean more branching (if/else, loops), making code harder to test and understand.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Cyclomatic_complexity",
	},
	ccn: {
		definition:
			"CCN (Cyclomatic Complexity Number) — counts independent execution paths through a function. A score above 10 is generally considered complex; above 20 is hard to test reliably.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Cyclomatic_complexity",
	},
	nloc: {
		definition:
			"Non-Commented Lines of Code — lines that actually do something, excluding blank lines and comments. Longer functions are generally harder to maintain.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Source_lines_of_code",
	},
	shapScore: {
		definition:
			"Shows how much each input (complexity, sentiment, etc.) pushed the risk score up or down. Positive values raise risk; negative values lower it.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Shapley_value",
	},
	changeEntropy: {
		definition:
			"Measures how spread out code changes are across the file. High entropy means many different parts were edited, which can signal scattered or disorganized development.",
		learnMoreUrl: "https://dl.acm.org/doi/10.1145/1368088.1368132",
	},
	ndev: {
		definition:
			"Number of distinct developers who have committed changes to this file. Files touched by many developers can accumulate inconsistencies over time.",
		learnMoreUrl: "https://ieeexplore.ieee.org/document/4273069",
	},
	sentimentTrajectory: {
		definition:
			"A chart showing how the emotional tone of commit messages has changed over time. A rising caution trend can signal growing developer frustration or uncertainty about the file.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Sentiment_analysis",
	},
	driftCategory: {
		definition:
			"A label describing how this file's risk pattern has changed — for example, whether risk is accelerating, recovering after a refactor, or slowly building up with little activity.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Technical_debt",
	},
	cautionProbability: {
		definition:
			"The model's estimated likelihood (0–1) that a commit signals risk or concern, based on commit message sentiment and code metrics. Values closer to 1 indicate higher concern.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Logistic_regression",
	},
	baseRate: {
		definition:
			"The average caution probability across all files in this repository — the baseline before factoring in this file's individual characteristics.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Base_rate",
	},
	ageScore: {
		definition:
			"Reflects how recently and frequently the file has been changed. A higher score means recent churn, which can indicate instability.",
		learnMoreUrl: "https://en.wikipedia.org/wiki/Software_rot",
	},
	lowInfoRatio: {
		definition:
			"The share of commits with short or vague messages (e.g., 'fix', 'update', 'wip'). High ratios make it harder to understand why the file changed.",
		learnMoreUrl: "https://cbea.ms/git-commit/",
	},
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
