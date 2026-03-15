"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import Button3D from "@/components/ui/Button3D";

type AuthMode = "signin" | "signup";

function getEmailRedirectUrl(): string | undefined {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = configuredAppUrl || browserOrigin;
  if (!baseUrl) return undefined;
  return `${baseUrl.replace(/\/+$/, "")}/login`;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const redirectTo = getEmailRedirectUrl() ?? window.location.origin + "/home";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar com Google.";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Informe email e senha.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw signInError;
        }

        const hasProfile =
          typeof data.user?.user_metadata?.username === "string" &&
          data.user.user_metadata.username.trim().length > 0;
        router.replace(hasProfile ? "/home" : "/onboarding");
        return;
      }

      const emailRedirectTo = getEmailRedirectUrl();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });

      if (signUpError) {
        throw signUpError;
      }

      let user = signUpData.user;

      if (!signUpData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw signInError;
        }
        user = signInData.user;
      }

      const hasProfile =
        typeof user?.user_metadata?.username === "string" &&
        user.user_metadata.username.trim().length > 0;
      router.replace(hasProfile ? "/home" : "/onboarding");
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na autenticacao.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8">
      <div className="text-center flex flex-col items-center">
        <img
          src="/achoq-logo.png"
          alt="achoQ"
          className="w-32 h-32 object-contain mb-2"
        />
        <p className="text-gray-500 text-sm font-semibold">Eai, o que voce acha hoje?</p>
      </div>

      <div className="w-full space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-3xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? "Conectando..." : "Entrar com Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-semibold">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
            className={[
              "flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors",
              mode === "signin"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            className={[
              "flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors",
              mode === "signup"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            Criar conta
          </button>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="voce@exemplo.com"
            className="w-full bg-white rounded-3xl px-5 py-4 border-2 border-gray-200 font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-2 block">Senha</label>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            disabled={loading}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="******"
            className="w-full bg-white rounded-3xl px-5 py-4 border-2 border-gray-200 font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-primary"
          />
        </div>

        {mode === "signup" && (
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">Confirmar senha</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={loading}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
                setMessage("");
              }}
              placeholder="******"
              className="w-full bg-white rounded-3xl px-5 py-4 border-2 border-gray-200 font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-primary"
            />
          </div>
        )}

        {error && <p className="text-nao text-sm font-semibold">{error}</p>}
        {message && <p className="text-sim text-sm font-semibold">{message}</p>}

        <Button3D
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleSubmit}
        >
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </Button3D>
      </div>
    </div>
  );
}
