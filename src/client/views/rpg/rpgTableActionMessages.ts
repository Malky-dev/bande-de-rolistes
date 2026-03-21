export function getSignupSuccessMessage(): string {
  return "Inscription enregistrée.";
}

export function getUnsignupSuccessMessage(): string {
  return "Désinscription effectuée.";
}

export function getSignupErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Inscription impossible";
}

export function getUnsignupErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Désinscription impossible";
}
