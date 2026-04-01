import type { KeyboardEvent, ReactElement } from "react";

import {
  formatDate,
  statusClass,
  statusLabel,
} from "@/client/views/rpgTablesView.helpers";
import type { RpgTableListItem } from "@/types/api/rpg";

type Props = {
  tables: RpgTableListItem[];
  selectedID: number | null;
  canEditTable: (table: RpgTableListItem) => boolean;
  onSelectTable: (eventID: number) => void;
  onEditTable: (eventID: number) => void;
};

function handleKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  eventID: number,
  onSelectTable: (nextEventID: number) => void,
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelectTable(eventID);
  }
}

export default function RpgTableList({
  tables,
  selectedID,
  canEditTable,
  onSelectTable,
  onEditTable,
}: Props): ReactElement {
  if (tables.length === 0) {
    return <div className="rpg-empty">Aucune table à venir.</div>;
  }

  return (
    <>
      {tables.map((table) => (
        <div
          key={table.eventID}
          role="button"
          tabIndex={0}
          className={`rpg-list-item rpg-list-item--card ${
            selectedID === table.eventID ? "rpg-list-item--active" : ""
          }`}
          onClick={() => onSelectTable(table.eventID)}
          onKeyDown={(event) =>
            handleKeyDown(event, table.eventID, onSelectTable)
          }
        >
          <div className="rpg-list-item__top">
            <span className="rpg-list-item__title">
              {table.game.toUpperCase()}
            </span>
          </div>

          <div className="rpg-list-item__meta">
            <span>{formatDate(table.eventDate)}</span>
          </div>

          <div className="rpg-list-item__meta">
            <span>Lieu : {table.location}</span>
          </div>

          <div className="rpg-list-item__meta rpg-list-item__meta--with-action">
            <span>MJ : {table.dungeonMaster.nickname}</span>
            <span>•</span>
            <span>{table.maxPlayers} places</span>
          </div>

          <div className="rpg-list-item__actions">
            <span className={statusClass(table.status)}>
              {statusLabel(table.status)}
            </span>

            {canEditTable(table) ? (
              <button
                type="button"
                className="btn-secondary btn-secondary--xs"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditTable(table.eventID);
                }}
              >
                Modifier
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </>
  );
}
