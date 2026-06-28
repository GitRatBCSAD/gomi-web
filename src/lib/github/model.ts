import * as v from "valibot";

export const RepositorySchema = v.object({
	id: v.number(),
	name: v.string(),
	fullName: v.string(),
	private: v.boolean(),
	htmlUrl: v.pipe(v.string(), v.url()),
});
export type Repository = v.InferOutput<typeof RepositorySchema>

export type AnalyzeRepositoryRequest = {
    owner: string;
    repository: string;
}
