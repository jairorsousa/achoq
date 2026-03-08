"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import Button3D from "@/components/ui/Button3D";

export default function EntrarGrupoPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!firebaseUser) return;
    if (code.trim().length < 4) {
      setError("Codigo invalido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: joinError } = await supabase.rpc("join_group_by_code", {
        p_code: code.trim().toUpperCase(),
      });

      if (joinError) {
        throw new Error(joinError.message);
      }

      const groupId = (data as { group_id?: string } | null)?.group_id;
      if (!groupId) {
        throw new Error("Grupo nao encontrado.");
      }

      router.replace(`/grupos/${groupId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar no grupo.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">+</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Entrar em grupo</h1>
          <p className="text-sm text-gray-400 mt-2">Insira o codigo de convite enviado pelo criador do grupo.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-600 block">Codigo de convite</label>
          <input
            type="text"
            placeholder="ex: ABC123"
            value={code}
            maxLength={8}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            className={[
              "w-full bg-white rounded-3xl px-5 py-4 border-2 font-extrabold text-gray-900 tracking-widest text-center uppercase placeholder:text-gray-400 outline-none transition-colors",
              error ? "border-nao" : "border-gray-200 focus:border-primary",
            ].join(" ")}
          />
          {error && <p className="text-nao text-sm font-semibold text-center">{error}</p>}
        </div>

        <Button3D
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={code.trim().length < 4}
          onClick={handleJoin}
        >
          Entrar
        </Button3D>
      </div>
    </div>
  );
}
