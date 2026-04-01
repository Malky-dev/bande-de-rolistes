import type { ReactElement } from "react";

import {
  formatDate,
  statusClass,
  statusLabel,
} from "@/client/views/rpgTablesView.helpers";
import type { RpgSignupItem, RpgTableDetails } from "@/types/api/rpg";

type Props = {
  details: RpgTableDetails | null;
  detailsLoading: boolean;
  actionLoading: boolean;
  success: string | null;
  error: string | null;
  canLogin: boolean;
  canSignup: boolean;
  canUnsignup: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onUnsignup: () => void;
};

export default function RpgTableDetailsPanel({
  details,
  detailsLoading,
  actionLoading,
  success,
  error,
  canLogin,
  canSignup,
  canUnsignup,
  onLogin,
  onSignup,
  onUnsignup,
}: Props): ReactElement {
  if (detailsLoading) {
    return <div className="rpg-empty">Chargement de la table…</div>;
  }

  if (details === null && error !== null) {
    return <div className="rpg-empty">{error}</div>;
  }

  if (details === null) {
    return <div className="rpg-empty">Sélectionne une table.</div>;
  }

  return (
    <>
      <div className="rpg-detail__header">
        <div>
          <h3 className="rpg-detail__title">{details.game.toUpperCase()}</h3>

          <div className="rpg-detail__meta">
            <span>{formatDate(details.eventDate)}</span>
            <span>•</span>
            <span>{details.location}</span>
            <span>•</span>
            <span>MJ : {details.dungeonMaster.nickname}</span>
          </div>
        </div>

        <div className="rpg-detail__actions">
          {statusClass(details.status) !== "rpg-status rpg-status--open" ? (
            <span className={statusClass(details.status)}>
              {statusLabel(details.status)}
            </span>
          ) : null}

          {canLogin ? (
            <div className="rpg-buttons">
              <button className="btn-primary" type="button" onClick={onLogin}>
                Se connecter
              </button>

              <button
                className="btn-discord"
                type="button"
                onClick={() => {
                  window.location.href = "/api/discord/init";
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Se connecter avec Discord
              </button>
            </div>
          ) : null}

          {canSignup ? (
            <div className="rpg-buttons">
              <button
                className="btn-primary"
                type="button"
                onClick={onSignup}
                disabled={actionLoading}
              >
                {actionLoading ? "Inscription…" : "S'inscrire"}
              </button>
            </div>
          ) : null}

          {canUnsignup ? (
            <div className="rpg-buttons">
              <button
                className="btn-secondary"
                type="button"
                onClick={onUnsignup}
                disabled={actionLoading}
              >
                {actionLoading ? "Désinscription…" : "Se désinscrire"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rpg-detail__content">
        {success !== null ? <p className="auth-success">{success}</p> : null}
        {error !== null ? <p className="auth-error">{error}</p> : null}

        <div className="rpg-block">
          <h4>Description</h4>
          <p>{details.comments || "—"}</p>
        </div>

        <div className="rpg-block">
          <h4>
            Joueurs confirmés ({details.confirmed.length}/{details.confirmedCap}
            )
          </h4>
          {details.confirmed.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {details.confirmed.map((player: RpgSignupItem) => (
                <li key={player.userID}>{player.nickname}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rpg-block">
          <h4>Liste d&apos;attente ({details.waitlist.length})</h4>
          {details.waitlist.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {details.waitlist.map((player: RpgSignupItem) => (
                <li key={player.userID}>{player.nickname}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
