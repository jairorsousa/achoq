"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import Button3D from "@/components/ui/Button3D";

function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function CriarGrupoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!user) return;
    if (name.trim().length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let createdGroupId: string | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const inviteCode = generateCode();
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .insert({
            name: name.trim(),
            invite_code: inviteCode,
            owner_id: user.uid,
          })
          .select("id")
          .single();

        if (groupError) {
          const duplicateInvite =
            groupError.message.includes("groups_invite_code_key") ||
            groupError.message.toLowerCase().includes("duplicate key");
          if (duplicateInvite) {
            continue;
          }
          throw new Error(groupError.message);
        }

        const groupId = groupData.id as string;
        const { error: memberError } = await supabase.from("group_members").insert({
          group_id: groupId,
          user_id: user.uid,
        });

        if (memberError) {
          throw new Error(memberError.message);
        }

        createdGroupId = groupId;
        break;
      }

      if (!createdGroupId) {
        throw new Error("Nao foi possivel gerar codigo de convite unico. Tente novamente.");
      }

      router.replace(`/grupos/${createdGroupId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar grupo.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">grupo</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Criar grupo</h1>
          <p className="text-sm text-gray-400 mt-2">Convide amigos com o codigo gerado automaticamente.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-600 block">Nome do grupo</label>
          <input
            type="text"
            placeholder="ex: Galera do Futebol"
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className={[
              "w-full bg-white rounded-3xl px-5 py-4 border-2 font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-colors",
              error ? "border-nao" : "border-gray-200 focus:border-primary",
            ].join(" ")}
          />
          {error && <p className="text-nao text-sm font-semibold">{error}</p>}
        </div>

        <Button3D
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={name.trim().length < 3}
          onClick={handleCreate}
        >
          Criar grupo
        </Button3D>
      </div>
    </div>
  );
}
