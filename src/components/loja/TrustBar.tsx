const trustItems = [
  { icon: "🔒", title: "Compra Segura", desc: "Seus dados protegidos" },
  { icon: "🚚", title: "Frete Grátis", desc: "Acima de R$ 199" },
  { icon: "↩️", title: "Troca Grátis", desc: "Até 30 dias" },
  { icon: "✅", title: "Crediário Fácil", desc: "Aprovação em 2 min" },
];

export default function TrustBar() {
  return (
    <div className="bg-accent-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide gap-6 md:justify-between">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 min-w-[200px] md:min-w-0"
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="font-display font-bold text-sm text-secondary-500 whitespace-nowrap">
                  {item.title}
                </p>
                <p className="font-body text-xs text-gray-500 whitespace-nowrap">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
