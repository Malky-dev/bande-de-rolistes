import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";

import sequelize from "../db";

class PollVote extends Model<
  InferAttributes<PollVote>,
  InferCreationAttributes<PollVote>
> {
  declare voteID: CreationOptional<number>;
  declare pollID: number;
  declare optionID: number;
  declare userID: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PollVote.init(
  {
    voteID: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "vote_id",
    },
    pollID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "poll_id",
    },
    optionID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "option_id",
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "PollVote",
    tableName: "PollVotes",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["poll_id", "option_id", "user_id"],
        name: "poll_vote_unique_selection",
      },
      {
        fields: ["poll_id"],
        name: "poll_vote_poll_idx",
      },
      {
        fields: ["option_id"],
        name: "poll_vote_option_idx",
      },
      {
        fields: ["user_id"],
        name: "poll_vote_user_idx",
      },
    ],
  },
);

export default PollVote;
