"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import Button3D from "@/components/ui/Button3D";
import Card from "@/components/ui/Card";
import type { EventCategory } from "@/lib/types";

const CATEGORIES: EventCategory[] = [
  "esportes",
  "entretenimento",
  "politica",
  "tecnologia",
  "economia",
  "outros",
];

interface AdminEventFormProps {
  onCreated?: () => void;
}

export default function AdminEventForm({ onCreated }: AdminEventFormProps) {
  const { firebaseUser } = useAuthStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "esportes" as EventCategory,
    closesAt: "",
    featured: false,
    sponsored: false,
    sponsorName: "",
    sponsorLogoURL: "",
    seasonId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!form.title.trim() || !form.closesAt) {
      setError("Titulo e data de encerramento sao obrigatorios.");
      return;
    }
    if (form.sponsored && !form.sponsorName.trim()) {
      setError("Informe o nome do patrocinador para eventos patrocinados.");
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("events").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        closes_at: new Date(form.closesAt).toISOString(),
        featured: form.featured,
        sponsored: form.sponsored,
        sponsor_name: form.sponsored ? form.sponsorName.trim() : null,
        sponsor_logo_url: form.sponsored ? form.sponsorLogoURL.trim() : null,
        season_id: form.seasonId.trim() || null,
        status: "open",
        sim_count: 0,
        nao_count: 0,
        total_bets: 0,
        total_coins: 0,
        created_by: firebaseUser.uid,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw new Error(insertError.message);

      setForm({
        title: "",
        description: "",
        category: "esportes",
        closesAt: "",
        featured: false,
        sponsored: false,
        sponsorName: "",
        sponsorLogoURL: "",
        seasonId: "",
      });
      setSuccess(true);
      onCreated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar evento. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-extrabold text-gray-900 mb-4">Criar Evento</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Titulo *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder='Ex: "O Brasil sera campeao da Copa 2026?"'
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Descricao</label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Contexto adicional sobre o evento..."
            rows={3}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">Categoria *</label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value as EventCategory)}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">Encerra em *</label>
            <input
              type="datetime-local"
              value={form.closesAt}
              onChange={(e) => setField("closesAt", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setField("featured", e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
          <span className="text-sm font-bold text-gray-600">Evento em destaque</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.sponsored}
            onChange={(e) => setField("sponsored", e.target.checked)}
            className="w-5 h-5 accent-coin rounded"
          />
          <span className="text-sm font-bold text-gray-600">Evento patrocinado</span>
        </label>

        {form.sponsored && (
          <div className="space-y-3 rounded-2xl border border-coin/30 bg-coin/5 p-3">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Nome do patrocinador</label>
              <input
                type="text"
                value={form.sponsorName}
                onChange={(e) => setField("sponsorName", e.target.value)}
                placeholder="Ex: Marca X"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-coin"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Logo URL (opcional)</label>
              <input
                type="url"
                value={form.sponsorLogoURL}
                onChange={(e) => setField("sponsorLogoURL", e.target.value)}
                placeholder="https://..."
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-coin"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">Temporada ID (opcional)</label>
            <input
              type="text"
              value={form.seasonId}
              onChange={(e) => setField("seasonId", e.target.value)}
              placeholder="ex: copa-2026"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="text-nao text-sm font-semibold">{error}</p>}
        {success && <p className="text-sim text-sm font-semibold">Evento criado com sucesso!</p>}

        <Button3D variant="primary" size="md" className="w-full" loading={loading}>
          Criar Evento
        </Button3D>
      </form>
    </Card>
  );
}
