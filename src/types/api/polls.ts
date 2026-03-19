export type PollAuthorView = {
  userID: number;
  nickname: string;
};

export type PollVoterView = {
  userID: number;
  nickname: string;
};

export type PollOptionView = {
  optionID: number;
  label: string;
  displayOrder: number;
  voteCount: number;
  voters: PollVoterView[];
};

export type PollListItem = {
  pollID: number;
  title: string;
  description: string | null;
  endAt: string;
  createdAt: string;
  createdBy: PollAuthorView;
  maxSelections: number;
  totalVoters: number;
  totalVotes: number;
  isClosed: boolean;
  canManage: boolean;
};

export type PollDetails = {
  pollID: number;
  title: string;
  description: string | null;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: PollAuthorView;
  maxSelections: number;
  isClosed: boolean;
  canVote: boolean;
  canManage: boolean;
  myVote: number[];
  options: PollOptionView[];
};

export type CreatePollBody = {
  title: string;
  description?: string | null;
  endAt: string;
  maxSelections: number;
  options: string[];
};

export type UpdatePollBody = {
  title?: string;
  description?: string | null;
  endAt?: string;
  maxSelections?: number;
};

export type CreatePollOptionBody = {
  label: string;
};

export type UpdatePollOptionBody = {
  label?: string;
  displayOrder?: number;
};

export type ReplacePollVoteBody = {
  optionIDs: number[];
};
