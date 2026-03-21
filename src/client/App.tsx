import { useEffect, useState } from "react";
import type { View } from "@/types/navigation";
import type { SessionInfo } from "@/types/api/session";
import { apiSession, apiLogout } from "@/api/auth";
import AuthForms from "./components/AuthForms";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AppModal } from "./components/AppModal";
import { useUpsertModal } from "./app/useUpsertModal";
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
import type { ReactNode } from "react";

function App() {
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const rpgModal = useUpsertModal<number>();
  const pollModal = useUpsertModal<number>();

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

  function renderView(): ReactNode {
    switch (view) {
      case "home":
        return (
          <HomeView
            onDiscover={() => setView("about")}
            onJoinTable={() => setView("rpg")}
          />
        );

      case "about":
        return <AboutView />;

      case "what-is-rpg":
        return <WhatIsRpg />;

      case "location":
        return <LocationView />;

      case "rules":
        return <RuleView />;

      case "rpg":
        return (
          <RpgTablesView
            session={session}
            reloadToken={rpgModal.reloadToken}
            onCreateTable={rpgModal.openCreate}
            onEditTable={rpgModal.openEdit}
            onLogin={() => setView("login")}
          />
        );

      case "polls":
        return (
          <PollsView
            session={session}
            reloadToken={pollModal.reloadToken}
            onCreatePoll={pollModal.openCreate}
            onEditPoll={pollModal.openEdit}
            onLogin={() => setView("login")}
          />
        );

      case "quotes":
        return (
          <QuotesView session={session} onBackHome={() => setView("home")} />
        );

      case "login":
      case "signup":
        return (
          <AuthForms
            view={view}
            onSwitchView={setView}
            onLoginSuccess={handleLoginSuccess}
          />
        );

      case "admin":
        return (
          <AdminView session={session} onBackHome={() => setView("home")} />
        );

      case "account":
        return session ? (
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
        );

      default:
        return (
          <HomeView
            onDiscover={() => setView("about")}
            onJoinTable={() => setView("rpg")}
          />
        );
    }
  }

  return (
    <div className="app-root">
      <Navbar
        view={view}
        checkingSession={checkingSession}
        session={session}
        onChangeView={(v) => setView(v)}
        onLogout={() => void handleLogout()}
      />

      <main className="main">{renderView()}</main>

      <Footer onChangeView={(v) => setView(v)} />

      <AppModal
        isOpen={rpgModal.isOpen}
        onRequestClose={rpgModal.close}
        overlayClassName="appModal"
        contentClassName="appModal__dialog appModal__dialog--wide"
        overlayTestId="rpg-modal-overlay"
        contentTestId="rpg-modal-content"
      >
        <UpsertRpgTableView
          session={session}
          eventID={
            rpgModal.state.mode === "edit" ? rpgModal.state.editingId : null
          }
          onBack={rpgModal.close}
          onDone={rpgModal.handleSaved}
        />
      </AppModal>

      <AppModal
        isOpen={pollModal.isOpen}
        onRequestClose={pollModal.close}
        overlayClassName="appModal"
        contentClassName="appModal__dialog appModal__dialog--wide"
        overlayTestId="poll-modal-overlay"
        contentTestId="poll-modal-content"
      >
        <UpsertPollView
          session={session}
          pollID={
            pollModal.state.mode === "edit" ? pollModal.state.editingId : null
          }
          onBack={pollModal.close}
          onDone={pollModal.handleSaved}
        />
      </AppModal>
    </div>
  );
}

export default App;
