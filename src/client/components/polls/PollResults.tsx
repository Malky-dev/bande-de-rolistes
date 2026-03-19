import type { PollDetails } from "../../../types/api/polls";

type PollResultsProps = {
  poll: PollDetails;
};

function sortOptions(poll: PollDetails) {
  return [...poll.options].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.optionID - right.optionID;
  });
}

export default function PollResults({ poll }: PollResultsProps) {
  const sortedOptions = sortOptions(poll);

  return (
    <section>
      <h3>Résultats</h3>

      <ul>
        {sortedOptions.map((option) => (
          <li key={option.optionID}>
            <strong>{option.label}</strong>

            {option.voteCount === 0 ? (
              <p>0 vote.</p>
            ) : (
              <>
                <p>
                  {option.voteCount} vote{option.voteCount > 1 ? "s" : ""}.
                </p>
                <ul>
                  {option.voters.map((voter) => (
                    <li key={voter.userID}>{voter.nickname}</li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
