import { useEffect, useState } from "react";
import type { View } from "@/types/navigation";
import type { SessionInfo } from "../types/api/session";
import { apiSession } from "../api/authApi";
import { fetchCsrfToken } from "../api/securityApi";
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

function App() {
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [editingEventID, setEditingEventID] = useState<number | null>(null);
  const [rpgModalMode, setRpgModalMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [rpgReloadToken, setRpgReloadToken] = useState(0);

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
      const csrfToken = await fetchCsrfToken();
      await fetch("/api/logout", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        credentials: "include",
      });
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
        {view === "home" && <HomeView />}

        {view === "about" && <AboutView onJoinTable={() => setView("rpg")} />}

        {view === "what-is-rpg" && (
          <WhatIsRpg onJoinTable={() => setView("rpg")} />
        )}

        {view === "location" && (
          <LocationView onJoinTable={() => setView("rpg")} />
        )}

        {view === "rules" && <RuleView />}

        {view === "rpg" && (
          <>
            <RpgTablesView
              session={session}
              reloadToken={rpgReloadToken}
              onCreateTable={openRpgCreateModal}
              onEditTable={openRpgEditModal}
              onLogin={() => setView("login")}
            />

            {rpgModalMode !== null && (
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
              </div>
            )}
          </>
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
    </div>
  );
}

export default App;
