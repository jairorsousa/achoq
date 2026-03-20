import LojaHeader from "@/components/loja/LojaHeader";
import LojaBottomNav from "@/components/loja/LojaBottomNav";
import CartDrawer from "@/components/loja/CartDrawer";

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LojaHeader />
      <main className="pt-16 pb-20 min-h-screen">{children}</main>
      <LojaBottomNav />
      <CartDrawer />
    </>
  );
}
