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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      <div className="text-center">
        <div className="text-5xl mb-3">[e-mail]</div>
        <h1 className="text-3xl font-extrabold text-primary">achoQ</h1>
        <p className="text-gray-500 mt-1 text-sm">Acesse com email e senha</p>
      </div>

      <div className="w-full space-y-4">
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
