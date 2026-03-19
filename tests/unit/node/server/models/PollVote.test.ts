import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const pollVoteModelUrl = pathToFileURL(
  path.join(root, "src/server/models/PollVote.ts"),
).href;

const dbUrl = pathToFileURL(path.join(root, "src/server/db.ts")).href;

async function load() {
  vi.resetModules();
  vi.clearAllMocks();

  const sequelize = new Sequelize("test", "user", undefined, {
    dialect: "mysql",
    logging: false,
  });

  vi.doMock(dbUrl, () => ({
    __esModule: true,
    default: sequelize,
  }));

  const mod = await import(pollVoteModelUrl);

  return { PollVote: mod.default };
}

describe("model PollVote", () => {
  it("définit les métadonnées de table attendues et les champs du vote", async () => {
    const { PollVote } = await load();
    const attributes = PollVote.getAttributes();

    expect(PollVote.getTableName()).toBe("PollVotes");
    expect(PollVote.primaryKeyAttribute).toBe("voteID");
    expect(PollVote.options.timestamps).toBe(true);

    expect(attributes.voteID.primaryKey).toBe(true);
    expect(attributes.voteID.autoIncrement).toBe(true);

    expect(attributes.pollID.allowNull).toBe(false);
    expect(attributes.optionID.allowNull).toBe(false);
    expect(attributes.userID.allowNull).toBe(false);

    expect(attributes.createdAt.allowNull).toBe(false);
    expect(attributes.updatedAt.allowNull).toBe(false);
  });

  it("définit les index attendus (unicité et index de recherche)", async () => {
    const { PollVote } = await load();
    const indexes = PollVote.options.indexes as Array<{
      unique?: boolean;
      fields: string[];
      name: string;
    }>;

    expect(indexes).toBeDefined();
    expect(indexes.length).toBeGreaterThanOrEqual(4);

    const uniqueIndex = indexes.find(
      (i) => i.unique === true && i.name === "poll_vote_unique_selection",
    );
    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex?.fields).toEqual(["poll_id", "option_id", "user_id"]);

    expect(indexes.some((i) => i.name === "poll_vote_poll_idx")).toBe(true);
    expect(indexes.some((i) => i.name === "poll_vote_option_idx")).toBe(true);
    expect(indexes.some((i) => i.name === "poll_vote_user_idx")).toBe(true);
  });
});
