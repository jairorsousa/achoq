"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";
import { useToast } from "@/lib/stores/toastStore";
import PrizeCard from "@/components/shop/PrizeCard";
import Button3D from "@/components/ui/Button3D";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import type { GoldPackage, ShopCategory, ShopItem } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

const CATEGORIES: { id: ShopCategory | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "vouchers", label: "Vouchers" },
  { id: "in-app", label: "In-app" },
  { id: "fisicos", label: "Fisicos" },
];

const GOLD_PACKAGES: GoldPackage[] = [
  { id: "gold_500", label: "Starter", priceBRL: 5, goldAmount: 500 },
  { id: "gold_1200", label: "Boost", priceBRL: 10, goldAmount: 1200, bonusPercent: 20 },
  { id: "gold_3500", label: "Pro", priceBRL: 25, goldAmount: 3500, bonusPercent: 40 },
];

type ShopItemRow = {
  id: string;
  name: string;
  description: string | null;
  type: ShopItem["type"];
  category: ShopItem["category"];
  emoji: string | null;
  price: number | null;
  stock: number | null;
  sponsored_event_id: string | null;
  gold_only: boolean | null;
  gold_price: number | null;
  image_url: string | null;
  effect: Record<string, number | string> | null;
  available: boolean | null;
};

function mapShopItem(row: ShopItemRow): ShopItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    type: row.type,
    category: row.category,
    emoji: row.emoji ?? "[gift]",
    price: Number(row.price ?? 0),
    stock: row.stock ?? undefined,
    sponsoredEventId: row.sponsored_event_id ?? undefined,
    goldOnly: Boolean(row.gold_only),
    goldPrice: row.gold_price ?? undefined,
    imageURL: row.image_url ?? undefined,
    effect: row.effect ?? undefined,
    available: Boolean(row.available),
  };
}

export default function LojinhaPage() {
  const { user } = useAuthStore();
  const profile = useUserStore((s) => s.profile);
  const { toast } = useToast();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ShopCategory | "all">("all");
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [buyingGold, setBuyingGold] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .eq("available", true)
        .order("price", { ascending: true });

      if (!mounted) return;

      if (error) {
        setItems([]);
      } else {
        setItems((data ?? []).map((row) => mapShopItem(row as ShopItemRow)));
      }
      setLoading(false);
    };

    void loadItems();

    const channel = supabase
      .channel("shop_items_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_items" }, () => {
        void loadItems();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = category === "all" ? items : items.filter((i) => i.category === category);

  async function handleConfirmRedeem() {
    if (!confirmItem || !user) return;
    setRedeeming(true);
    try {
      const { error } = await supabase.rpc("redeem_shop_item", {
        p_item_id: confirmItem.id,
      });
      if (error) throw new Error(error.message);
      toast(`${confirmItem.name} resgatado com sucesso!`, "success");
      setConfirmItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao resgatar.";
      toast(msg, "error");
    } finally {
      setRedeeming(false);
    }
  }

  async function handleBuyGold(pkg: GoldPackage) {
    if (!user) return;
    setBuyingGold(pkg.id);
    try {
      const { error } = await supabase.rpc("purchase_gold_package", {
        p_package_id: pkg.id,
        p_sandbox_token: "sandbox_ok",
      });
      if (error) throw new Error(error.message);
      toast(`Compra concluida: +${formatCoins(pkg.goldAmount)} Q$ Gold`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao comprar Q$ Gold.";
      toast(msg, "error");
    } finally {
      setBuyingGold(null);
    }
  }

  const coins = profile?.coins ?? 0;
  const goldCoins = profile?.goldCoins ?? 0;
  const confirmPrice = confirmItem ? (confirmItem.goldOnly ? confirmItem.goldPrice ?? 0 : confirmItem.price) : 0;
  const confirmCurrency = confirmItem?.goldOnly ? "Q$G" : "Q$";

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Lojinha</h1>
        <p className="text-sm text-gray-500 mt-1">
          Saldo: <span className="font-extrabold text-coin-dark">{formatCoins(coins)} Q$</span>
        </p>
        <p className="text-xs text-yellow-700 font-bold mt-1">Gold: {formatCoins(goldCoins)} Q$G</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 space-y-3">
        <p className="text-sm font-extrabold text-yellow-700">Q$ Gold (premium)</p>
        <div className="grid gap-2">
          {GOLD_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl p-3 border border-yellow-100 flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-extrabold text-gray-900 text-sm">{pkg.label}</p>
                <p className="text-xs text-gray-500">
                  {formatCoins(pkg.goldAmount)} Q$G {pkg.bonusPercent ? `(+${pkg.bonusPercent}% bonus)` : ""}
                </p>
              </div>
              <Button3D
                variant="coin"
                size="sm"
                loading={buyingGold === pkg.id}
                onClick={() => handleBuyGold(pkg)}
              >
                R$ {pkg.priceBRL}
              </Button3D>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500">Sandbox ativo para testes de compra.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={[
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors",
              category === cat.id ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" height={96} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="font-bold text-gray-500">Nenhum item nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <PrizeCard
              key={item.id}
              item={item}
              userCoins={coins}
              userGold={goldCoins}
              onRedeem={setConfirmItem}
            />
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(confirmItem)} onClose={() => setConfirmItem(null)} title="Confirmar resgate">
        {confirmItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="text-4xl">{confirmItem.emoji}</div>
              <div>
                <p className="font-extrabold text-gray-900">{confirmItem.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{confirmItem.description}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo</span>
                <span className="font-extrabold text-coin-dark">{formatCoins(confirmPrice)} {confirmCurrency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo apos</span>
                <span className="font-semibold text-gray-700">
                  {confirmItem.goldOnly ? formatCoins(goldCoins - confirmPrice) : formatCoins(coins - confirmPrice)} {confirmCurrency}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button3D variant="ghost" className="flex-1" onClick={() => setConfirmItem(null)}>
                Cancelar
              </Button3D>
              <Button3D variant="coin" className="flex-1" loading={redeeming} onClick={handleConfirmRedeem}>
                Resgatar
              </Button3D>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
