"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import AvatarPicker, { AVATARS } from "@/components/auth/AvatarPicker";
import Button3D from "@/components/ui/Button3D";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<"username" | "avatar">("username");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  function handleUsernameNext() {
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError("3-20 caracteres: letras, numeros e _");
      return;
    }
    setStep("avatar");
  }

  async function handleFinish() {
    if (!user) return;
    setLoading(true);

    try {
      const normalizedUsername = username.toLowerCase();
      const today = new Date().toISOString().slice(0, 10);

      const { data: existingUsername } = await supabase
        .from("usernames")
        .select("user_id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (existingUsername && existingUsername.user_id !== user.uid) {
        setUsernameError("Este username ja esta em uso. Tente outro.");
        setStep("username");
        setLoading(false);
        return;
      }

      const { error: userError } = await supabase
        .from("users")
        .update({
          username: normalizedUsername,
          display_name: username,
          photo_url: avatar,
          last_active_date: today,
        })
        .eq("id", user.uid);

      if (userError) {
        setUsernameError(userError.message);
        setLoading(false);
        return;
      }

      const { error: usernameError } = await supabase
        .from("usernames")
        .upsert(
          {
            username: normalizedUsername,
            user_id: user.uid,
          },
          { onConflict: "username" }
        );

      if (usernameError) {
        setUsernameError(usernameError.message);
        setLoading(false);
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          username: normalizedUsername,
          display_name: username,
          avatar_url: avatar,
        },
      });

      if (metadataError) {
        setUsernameError(metadataError.message);
        setLoading(false);
        return;
      }

      router.replace("/home");
    } catch {
      setUsernameError("Erro ao salvar perfil inicial.");
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8">
      {step === "username" ? (
        <>
          <div className="text-center">
            <div className="text-5xl mb-3">[o/]</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Bem-vindo ao achoQ!</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Escolha um username unico para sua conta.
            </p>
          </div>

          <div className="w-full space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Seu username</label>
              <input
                type="text"
                placeholder="ex: palpiteiro123"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                maxLength={20}
                className={[
                  "w-full bg-white rounded-3xl px-5 py-4 border-2 font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-colors",
                  usernameError ? "border-nao" : "border-gray-200 focus:border-primary",
                ].join(" ")}
              />
              {usernameError && (
                <p className="text-nao text-sm font-semibold mt-2">{usernameError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {username.length}/20 - somente letras, numeros e _
              </p>
            </div>

            <Button3D
              variant="primary"
              size="lg"
              className="w-full"
              disabled={username.length < 3}
              onClick={handleUsernameNext}
            >
              Continuar -&gt;
            </Button3D>
          </div>
        </>
      ) : (
        <>
          <div className="text-center">
            <div className="text-5xl mb-3">[*]</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Escolha seu avatar</h1>
            <p className="text-gray-500 mt-2 text-sm">Como voce quer aparecer para os outros?</p>
          </div>

          <div className="w-full space-y-6">
            <AvatarPicker selected={avatar} onSelect={setAvatar} />

            <div className="flex gap-3">
              <Button3D
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setStep("username")}
              >
                &lt;- Voltar
              </Button3D>
              <Button3D
                variant="primary"
                size="md"
                className="flex-1"
                loading={loading}
                onClick={handleFinish}
              >
                Comecar
              </Button3D>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
