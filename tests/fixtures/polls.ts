import type { PollDetails } from "@/types/api/polls";

export function makePoll(overrides: Partial<PollDetails> = {}): PollDetails {
  return {
    pollID: 1,
    title: "Quel film d'Audiard ressort au ciné-club ?",
    description: null,
    endAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: { userID: 10, nickname: "Patricia" },
    maxSelections: 1,
    isClosed: false,
    canVote: true,
    canManage: false,
    myVote: [],
    options: [
      {
        optionID: 1,
        label: "Les Tontons flingueurs",
        displayOrder: 0,
        voteCount: 0,
        voters: [],
      },
      {
        optionID: 2,
        label: "Un singe en hiver",
        displayOrder: 1,
        voteCount: 0,
        voters: [],
      },
    ],
    ...overrides,
  };
}
