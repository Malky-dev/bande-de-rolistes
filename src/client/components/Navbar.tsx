import logoBDR from "@/assets/img/LogoBDR_creme-removebg.png";
import { canAccessAdmin, canManageQuotes } from "@/client/utils/permissions";
import type { SessionInfo } from "@/types/api/session";
import { mainNavItems, type View } from "@/types/navigation";

type NavbarProps = {
  view: View;
  checkingSession: boolean;
  session: SessionInfo | null;
  onChangeView: (view: View) => void;
  onLogout: () => void;
};

function Navbar({
  view,
  checkingSession,
  session,
  onChangeView,
  onLogout,
}: NavbarProps) {
  const canOpenQuotes = canManageQuotes(session);
  const canOpenAdmin = canAccessAdmin(session);

  return (
    <header className="navbar">
      <div
        className="navbar-logo"
        onClick={() => onChangeView("home")}
        style={{ cursor: "pointer" }}
      >
        <img
          src={logoBDR}
          alt="Bande de Rôlistes"
          className="navbar-logo-img"
        />
        <span>Bande de Rôlistes</span>
      </div>

      <nav className="navbar-links">
        {mainNavItems.map((item) => (
          <button
            key={item.view}
            className={`navbar-link navbar-link-button ${
              view === item.view ? "navbar-link-active" : ""
            }`}
            onClick={() => onChangeView(item.view)}
          >
            {item.label}
          </button>
        ))}

        {!checkingSession && session === null ? (
          <>
            <button
              className={`navbar-link navbar-link-button ${
                view === "login" ? "navbar-link-active" : ""
              }`}
              onClick={() => onChangeView("login")}
            >
              Connexion
            </button>
            <button
              className={`navbar-link navbar-cta navbar-link-button ${
                view === "signup" ? "navbar-link-active" : ""
              }`}
              onClick={() => onChangeView("signup")}
            >
              Inscription
            </button>
          </>
        ) : null}

        {canOpenQuotes ? (
          <button
            className={`navbar-link navbar-link-button ${
              view === "quotes" ? "navbar-link-active" : ""
            }`}
            onClick={() => onChangeView("quotes")}
          >
            Citations
          </button>
        ) : null}

        {session !== null ? (
          <>
            {canOpenAdmin ? (
              <button
                className={`navbar-link navbar-link-button ${
                  view === "admin" ? "navbar-link-active" : ""
                }`}
                onClick={() => onChangeView("admin")}
              >
                Privilèges Admin
              </button>
            ) : null}

            <button
              className={`navbar-link navbar-link-button ${
                view === "account" ? "navbar-link-active" : ""
              }`}
              onClick={() => onChangeView("account")}
            >
              Mon compte - {session.nickname}
            </button>

            <button
              className="navbar-link navbar-link-button"
              onClick={onLogout}
            >
              Déconnexion
            </button>
          </>
        ) : null}
      </nav>
    </header>
  );
}

export default Navbar;
