export const appViews = {
  home: {
    label: "Accueil",
    inNavbar: true,
  },
  "what-is-rpg": {
    label: "Le jeu de rôle",
    inNavbar: true,
  },
  about: {
    label: "Qui sommes-nous ?",
    inNavbar: true,
  },
  location: {
    label: "Nos locaux",
    inNavbar: true,
  },
  rpg: {
    label: "Tables JDR",
    inNavbar: true,
  },
  login: {
    label: "Connexion",
    inNavbar: false,
  },
  signup: {
    label: "Inscription",
    inNavbar: false,
  },
  admin: {
    label: "Admin",
    inNavbar: false,
  },
  account: {
    label: "Mon compte",
    inNavbar: false,
  },
  "rpg-create": {
    label: "Créer une table",
    inNavbar: false,
  },
  "rpg-edit": {
    label: "Modifier une table",
    inNavbar: false,
  },
  quotes: {
    label: "Citations",
    inNavbar: false,
  },
} as const;

export type View = keyof typeof appViews;

export const mainNavItems = Object.entries(appViews)
  .filter(([, config]) => config.inNavbar)
  .map(([view, config]) => ({
    view: view as View,
    label: config.label,
  }));
