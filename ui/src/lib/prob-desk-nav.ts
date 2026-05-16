export const PROB_DESK_VIEW_IDS = ["desk", "settings"] as const;

export type ProbDeskViewId = (typeof PROB_DESK_VIEW_IDS)[number];

export function isProbDeskViewId(id: string): id is ProbDeskViewId {
  return (PROB_DESK_VIEW_IDS as readonly string[]).includes(id);
}
