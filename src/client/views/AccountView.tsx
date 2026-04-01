import { useEffect, useMemo, useState } from "react";
import type { SessionInfo } from "../../types/api/session";
import { apiSession } from "../../api/auth";
import { apiGetAccount, apiUpdateAccount } from "../../api/account";

type AccountViewProps = {
  onBackHome: () => void;
  onSessionRefresh: (s: SessionInfo) => void;
};

function AccountView({ onBackHome, onSessionRefresh }: AccountViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [discordId, setDiscordId] = useState<string | null>(null);

  const hasDiscord = useMemo(
    () => typeof discordId === "string" && discordId.length > 0,
    [discordId],
  );

  useEffect(() => {
    let cancelled = false;

    const safeSet = (fn: () => void): void => {
      if (!cancelled) fn();
    };

    async function load(): Promise<void> {
      try {
        const me = await apiGetAccount();

        safeSet(() => {
          setEmail(me.email);
          setNickname(me.nickname);
          setDiscordId(me.discordId);
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Impossible de charger votre compte";

        safeSet(() => {
          setError(msg);
        });
      } finally {
        safeSet(() => {
          setLoading(false);
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    apiUpdateAccount({ nickname })
      .then(async () => {
        const s = await apiSession();
        onSessionRefresh(s);
        setSuccess("Infos mises à jour.");
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Impossible de sauvegarder";
        setError(msg);
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <section className="panel panel--center">
        <h2 className="panel__title">Mon compte</h2>
        <p className="panel__subtitle">On charge ta feuille de personnage…</p>
      </section>
    );
  }

  return (
    <section className="panel panel--center">
      <h2 className="panel__title">Mon compte</h2>

      <div className="auth-field">
        <label>Inscrit via Discord : {hasDiscord ? "Oui" : "Non"}</label>
      </div>

      <p className="panel__subtitle">
        Ici tu peux changer tes caractéristiques et tes compétences.
      </p>

      <form className="auth-form auth-form--spaced" onSubmit={handleSave}>
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} disabled />
        </div>

        <p className="account-help">
          Pour changer ton email, demande à un gentil organisateur de
          l&apos;association.
        </p>
        <p className="account-help account-help--em">
          (un bon jet de persuasion ou de charisme sera apprécié).
        </p>

        <div className="auth-field">
          <label>Pseudo</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <div className="hero-actions">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
          <button className="btn-secondary" type="button" onClick={onBackHome}>
            Retour
          </button>
        </div>
      </form>
    </section>
  );
}

export default AccountView;
