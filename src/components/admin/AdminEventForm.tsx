"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { uploadEventImage } from "@/lib/supabase/storage";
import { useAuthStore } from "@/lib/stores/authStore";
import Button3D from "@/components/ui/Button3D";
import Card from "@/components/ui/Card";
import type { EventCategory, EventType } from "@/lib/types";

const CATEGORIES: EventCategory[] = [
  "esportes",
  "entretenimento",
  "politica",
  "tecnologia",
  "economia",
  "outros",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AdminEventFormProps {
  onCreated?: () => void;
}

export default function AdminEventForm({ onCreated }: AdminEventFormProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [eventType, setEventType] = useState<EventType>("binary");
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError("");
    setSuccess(false);
  }

  function setOption(index: number, value: string) {
    setOptions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
    setError("");
    setSuccess(false);
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato invalido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Imagem muito grande. Maximo 2 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.closesAt) {
      setError("Titulo e data de encerramento sao obrigatorios.");
      return;
    }
    if (form.sponsored && !form.sponsorName.trim()) {
      setError("Informe o nome do patrocinador para eventos patrocinados.");
      return;
    }

    // Validar alternativas apenas para multipla escolha
    let cleanedOptions: string[] = [];
    if (eventType === "multiple") {
      cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
      if (cleanedOptions.length < 2) {
        setError("Informe pelo menos 2 alternativas para o evento.");
        return;
      }
      if (new Set(cleanedOptions.map((option) => option.toLowerCase())).size !== cleanedOptions.length) {
        setError("As alternativas nao podem ser repetidas.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Criar o evento
      const { data: eventData, error: insertError } = await supabase
        .from("events")
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          event_type: eventType,
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
          winner_option_id: null,
          created_by: user.uid,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) throw new Error(insertError.message);
      if (!eventData?.id) throw new Error("Nao foi possivel obter o ID do evento.");

      // 2. Upload de imagem (se houver)
      if (imageFile && form.featured) {
        try {
          const imageUrl = await uploadEventImage(imageFile, eventData.id);
          await supabase
            .from("events")
            .update({ image_url: imageUrl })
            .eq("id", eventData.id);
        } catch {
          // Imagem falhou, mas evento foi criado — segue sem imagem
          console.warn("Falha no upload da imagem, evento criado sem imagem.");
        }
      }

      // 3. Criar opcoes
      const optionsToInsert =
        eventType === "binary"
          ? [{ event_id: eventData.id, label: form.title.trim(), sort_order: 0, sim_pool: 0, nao_pool: 0, total_bets: 0, active: true }]
          : cleanedOptions.map((label, idx) => ({
              event_id: eventData.id,
              label,
              sort_order: idx,
              sim_pool: 0,
              nao_pool: 0,
              total_bets: 0,
              active: true,
            }));

      const { error: optionsError } = await supabase.from("event_options").insert(optionsToInsert);

      if (optionsError) {
        await supabase.from("events").delete().eq("id", eventData.id);
        throw new Error(optionsError.message);
      }

      // 4. Reset
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
      setOptions(["", ""]);
      removeImage();
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
        {/* Tipo do evento */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">Tipo do evento</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEventType("binary")}
              className={[
                "flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all",
                eventType === "binary"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200",
              ].join(" ")}
            >
              SIM ou NAO
            </button>
            <button
              type="button"
              onClick={() => setEventType("multiple")}
              className={[
                "flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all",
                eventType === "multiple"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200",
              ].join(" ")}
            >
              Multipla escolha
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {eventType === "binary"
              ? "Usuarios apostam SIM ou NAO diretamente na pergunta."
              : "Usuarios escolhem entre varias alternativas."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">
            {eventType === "binary" ? "Pergunta *" : "Titulo *"}
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder={
              eventType === "binary"
                ? 'Ex: "O namoro de Virginia e Vini Jr terminara em 2027?"'
                : 'Ex: "Qual filme sera o vencedor do Oscar 2026?"'
            }
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

        {/* Evento em destaque + imagem */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setField("featured", e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
          <span className="text-sm font-bold text-gray-600">Evento em destaque</span>
        </label>

        {form.featured && (
          <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <label className="block text-sm font-bold text-gray-600">
              Imagem de destaque
            </label>
            <p className="text-xs text-gray-400 -mt-1">
              Recomendado: 800 x 400 px (proporcao 2:1). JPG, PNG ou WebP. Max 2 MB.
            </p>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-2xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <span className="text-2xl">📷</span>
                <span className="text-sm font-bold">Selecionar imagem</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        )}

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

        {/* Alternativas - apenas para multipla escolha */}
        {eventType === "multiple" && (
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-bold text-gray-600">Alternativas *</label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs font-extrabold text-primary"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => setOption(idx, e.target.value)}
                    placeholder={`Alternativa ${idx + 1}`}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                    className="text-xs font-bold text-nao disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-nao text-sm font-semibold">{error}</p>}
        {success && <p className="text-sim text-sm font-semibold">Evento criado com sucesso!</p>}

        <Button3D variant="primary" size="md" className="w-full" loading={loading}>
          Criar Evento
        </Button3D>
      </form>
    </Card>
  );
}
