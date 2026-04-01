import { useCallback, useState } from "react";

import { apiLogin, apiSession, apiSignin } from "@/api/auth";
import type { SessionInfo } from "@/types/api/session";

type AuthView = "home" | "login" | "signup";

type UseAuthFormsArgs = {
  view: AuthView;
  onSwitchView: (view: AuthView) => void;
  onLoginSuccess: (session: SessionInfo) => void;
};

type AuthField = "nickname" | "email" | "password" | "passwordCheck";

const GENERIC_ERROR_MESSAGE = "Une erreur est survenue";
const PASSWORD_MISMATCH_ERROR = "Les mots de passe ne correspondent pas";

function buildSubmitErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : GENERIC_ERROR_MESSAGE;
}

export function useAuthForms({
  view,
  onSwitchView,
  onLoginSuccess,
}: UseAuthFormsArgs) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = view === "login";

  const updateField = useCallback((field: AuthField, value: string): void => {
    switch (field) {
      case "nickname":
        setNickname(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "passwordCheck":
        setPasswordCheck(value);
        break;
    }
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);

    if (!isLogin && password !== passwordCheck) {
      setError(PASSWORD_MISMATCH_ERROR);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await apiLogin(email, password);
      } else {
        await apiSignin(nickname, email, password, passwordCheck);
        await apiLogin(email, password);
      }

      const session = await apiSession();
      onLoginSuccess(session);
    } catch (cause) {
      setError(buildSubmitErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [email, isLogin, nickname, onLoginSuccess, password, passwordCheck]);

  const switchAuthView = useCallback((): void => {
    onSwitchView(isLogin ? "signup" : "login");
  }, [isLogin, onSwitchView]);

  const loginWithDiscord = useCallback((): void => {
    window.location.href = "/api/discord/init";
  }, []);

  return {
    nickname,
    email,
    password,
    passwordCheck,
    loading,
    error,
    isLogin,
    updateField,
    submit,
    switchAuthView,
    loginWithDiscord,
  };
}
