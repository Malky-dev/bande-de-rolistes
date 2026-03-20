import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { View } from "@/types/navigation";
import type { SessionInfo } from "../types/api/session";
import { apiSession } from "../api/auth";
import AuthForms from "./components/AuthForms";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeView from "./views/HomeView";
import AdminView from "./views/AdminView";
import RpgTablesView from "./views/RpgTablesView";
import AccountView from "./views/AccountView";
import ForbiddenView from "./views/ForbiddenView";
import UpsertRpgTableView from "./views/rpg/UpsertRpgTableView";
import QuotesView from "./views/QuoteView";
import WhatIsRpg from "./views/WhatIsRpgView";
import AboutView from "./views/AboutView";
import LocationView from "./views/LocationView";
import RuleView from "./views/RuleView";
import PollsView from "./views/PollsView";
import UpsertPollView from "./views/polls/UpsertPollView";
import { apiLogout } from "../api/auth";

function App() {
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [editingEventID, setEditingEventID] = useState<number | null>(null);
  const [rpgModalMode, setRpgModalMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [rpgReloadToken, setRpgReloadToken] = useState(0);

  const [editingPollID, setEditingPollID] = useState<number | null>(null);
  const [pollModalMode, setPollModalMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [pollReloadToken, setPollReloadToken] = useState(0);

  const openRpgCreateModal = () => {
    setEditingEventID(null);
    setRpgModalMode("create");
  };

  const openRpgEditModal = (eventID: number) => {
    setEditingEventID(eventID);
    setRpgModalMode("edit");
  };

  const closeRpgModal = () => {
    setRpgModalMode(null);
    setEditingEventID(null);
  };

  const handleRpgSaved = () => {
    setRpgReloadToken((v) => v + 1);
    closeRpgModal();
  };

  const openPollCreateModal = () => {
    setEditingPollID(null);
    setPollModalMode("create");
  };

  const openPollEditModal = (pollID: number) => {
    setEditingPollID(pollID);
    setPollModalMode("edit");
  };

  const closePollModal = () => {
    setPollModalMode(null);
    setEditingPollID(null);
  };

  const handlePollSaved = () => {
    setPollReloadToken((v) => v + 1);
    closePollModal();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const discordError = urlParams.get("error");

    if (discordError) {
      console.error("Erreur Discord OAuth:", discordError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    async function checkSession(): Promise<void> {
      try {
        const s = await apiSession();
        setSession(s);
        setView("home");
      } catch {
        setSession(null);
      } finally {
        setCheckingSession(false);
      }
    }

    void checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }

    setSession(null);
    setView("home");
  };

  const handleLoginSuccess = (s: SessionInfo) => {
    setSession(s);
    setView("home");
  };

  return (
    <div className="app-root">
      <Navbar
        view={view}
        checkingSession={checkingSession}
        session={session}
        onChangeView={(v) => setView(v)}
        onLogout={() => void handleLogout()}
      />

      <main className="main">
        {view === "home" && (
          <HomeView
            onDiscover={() => setView("about")}
            onJoinTable={() => setView("rpg")}
          />
        )}

        {view === "about" && <AboutView />}

        {view === "what-is-rpg" && <WhatIsRpg />}

        {view === "location" && <LocationView />}

        {view === "rules" && <RuleView />}

        {view === "rpg" && (
          <RpgTablesView
            session={session}
            reloadToken={rpgReloadToken}
            onCreateTable={openRpgCreateModal}
            onEditTable={openRpgEditModal}
            onLogin={() => setView("login")}
          />
        )}

        {view === "polls" && (
          <PollsView
            session={session}
            reloadToken={pollReloadToken}
            onCreatePoll={openPollCreateModal}
            onEditPoll={openPollEditModal}
            onLogin={() => setView("login")}
          />
        )}

        {view === "quotes" && (
          <QuotesView session={session} onBackHome={() => setView("home")} />
        )}

        {(view === "login" || view === "signup") && (
          <AuthForms
            view={view}
            onSwitchView={setView}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {view === "admin" && (
          <AdminView session={session} onBackHome={() => setView("home")} />
        )}

        {view === "account" &&
          (session ? (
            <AccountView
              onBackHome={() => setView("home")}
              onSessionRefresh={(s) => setSession(s)}
            />
          ) : (
            <ForbiddenView
              title="Connexion requise"
              message="Vous devez être connecté pour accéder à votre compte."
              onBackHome={() => setView("login")}
            />
          ))}
      </main>

      <Footer onChangeView={(v) => setView(v)} />

      {rpgModalMode !== null &&
        createPortal(
          <div
            className="appModal"
            role="dialog"
            aria-modal="true"
            data-testid="rpg-modal-overlay"
            onClick={closeRpgModal}
          >
            <div
              className="appModal__dialog appModal__dialog--wide"
              data-testid="rpg-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <UpsertRpgTableView
                session={session}
                eventID={rpgModalMode === "edit" ? editingEventID : null}
                onBack={closeRpgModal}
                onDone={handleRpgSaved}
              />
            </div>
          </div>,
          document.body,
        )}

      {pollModalMode !== null &&
        createPortal(
          <div
            className="appModal"
            role="dialog"
            aria-modal="true"
            data-testid="poll-modal-overlay"
            onClick={closePollModal}
          >
            <div
              className="appModal__dialog appModal__dialog--wide"
              data-testid="poll-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <UpsertPollView
                session={session}
                pollID={pollModalMode === "edit" ? editingPollID : null}
                onBack={closePollModal}
                onDone={handlePollSaved}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default App;
