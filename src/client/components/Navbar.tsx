import type { SessionInfo } from "../../types/api/session";
import logoBDR from "../../assets/img/LogoBDR_creme-removebg.png";

type View =
  | "home"
  | "login"
  | "signup"
  | "admin"
  | "account"
  | "rpg"
  | "rpg-create"
  | "rpg-edit"
  | "quotes"
  | "what-is-rpg";

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
        <button
          className={`navbar-link navbar-link-button ${
            view === "home" ? "navbar-link-active" : ""
          }`}
          onClick={() => onChangeView("home")}
        >
          Accueil
        </button>

        <button
          className={`navbar-link navbar-link-button ${
            view === "rpg" ? "navbar-link-active" : ""
          }`}
          onClick={() => onChangeView("rpg")}
        >
          Tables JDR
        </button>

        <button className="navbar-link navbar-link-button">
          Qui sommes-nous ?
        </button>

        <button
          className={`navbar-link navbar-link-button ${
            view === "what-is-rpg" ? "navbar-link-active" : ""
          }`}
          onClick={() => onChangeView("what-is-rpg")}
        >
          Le jeu de rôle
        </button>

        {!checkingSession && !session && (
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
        )}

        {session &&
          (session.role === "admin" || session.role === "organisator") && (
            <button
              className={`navbar-link navbar-link-button ${
                view === "quotes" ? "navbar-link-active" : ""
              }`}
              onClick={() => onChangeView("quotes")}
            >
              Citations
            </button>
          )}

        {session && (
          <>
            {session.role === "admin" && (
              <button
                className={`navbar-link navbar-link-button ${
                  view === "admin" ? "navbar-link-active" : ""
                }`}
                onClick={() => onChangeView("admin")}
              >
                Privilèges Admin
              </button>
            )}
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
        )}
      </nav>
    </header>
  );
}

export default Navbar;
