import type { Product, Category } from "@/lib/types/loja";

export const categories: Category[] = [
  { slug: "celulares", name: "Celulares", icon: "📱", color: "#FFE8DA" },
  {
    slug: "eletrodomesticos",
    name: "Eletrodomésticos",
    icon: "🏠",
    color: "#EEF2F7",
  },
  { slug: "moveis", name: "Móveis", icon: "🛋️", color: "#FFF4CC" },
  { slug: "eletronicos", name: "Eletrônicos", icon: "📺", color: "#FFF5EF" },
  { slug: "moda", name: "Moda", icon: "👟", color: "#CCF6F1" },
  { slug: "beleza", name: "Beleza", icon: "💄", color: "#FFE8DA" },
];

export const products: Product[] = [
  // ── CELULARES ──
  {
    id: "cel-1",
    name: "Samsung Galaxy A15 128GB",
    category: "celulares",
    price: 899.9,
    originalPrice: 1199.9,
    maxInstallments: 48,
    image: "📱",
    imageBg: "#EEF2F7",
    description:
      "Smartphone Samsung Galaxy A15 com tela Super AMOLED de 6.5\", câmera tripla de 50MP, bateria de 5000mAh e 128GB de armazenamento. Ideal para o dia a dia.",
    specs: [
      { label: "Tela", value: '6.5" Super AMOLED' },
      { label: "Câmera", value: "50MP + 5MP + 2MP" },
      { label: "Bateria", value: "5000mAh" },
      { label: "Memória", value: "4GB RAM + 128GB" },
    ],
    badges: [
      { type: "desconto", label: "-25%" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.5,
    reviewCount: 1243,
  },
  {
    id: "cel-2",
    name: "Motorola Moto G24 128GB",
    category: "celulares",
    price: 749.9,
    originalPrice: 999.9,
    maxInstallments: 36,
    image: "📱",
    imageBg: "#E6FBF8",
    description:
      "Motorola Moto G24 com processador octa-core, tela IPS de 6.6\", câmera de 50MP e design moderno. Bateria que dura o dia todo.",
    specs: [
      { label: "Tela", value: '6.6" IPS LCD' },
      { label: "Câmera", value: "50MP + 2MP" },
      { label: "Bateria", value: "5000mAh" },
      { label: "Memória", value: "4GB RAM + 128GB" },
    ],
    badges: [
      { type: "desconto", label: "-25%" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.3,
    reviewCount: 876,
  },
  {
    id: "cel-3",
    name: "Xiaomi Redmi Note 13 256GB",
    category: "celulares",
    price: 1299.9,
    originalPrice: 1599.9,
    maxInstallments: 48,
    image: "📱",
    imageBg: "#FFF4CC",
    description:
      "Xiaomi Redmi Note 13 com tela AMOLED 120Hz, câmera de 108MP, carregamento rápido 33W e 256GB. Performance premium por um preço acessível.",
    specs: [
      { label: "Tela", value: '6.67" AMOLED 120Hz' },
      { label: "Câmera", value: "108MP + 8MP + 2MP" },
      { label: "Bateria", value: "5000mAh" },
      { label: "Memória", value: "8GB RAM + 256GB" },
    ],
    badges: [
      { type: "desconto", label: "-19%" },
      { type: "novo", label: "Novidade" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.7,
    reviewCount: 2105,
  },
  {
    id: "cel-4",
    name: "Samsung Galaxy A25 5G 128GB",
    category: "celulares",
    price: 1199.9,
    originalPrice: 1499.9,
    maxInstallments: 48,
    image: "📱",
    imageBg: "#FFE8DA",
    description:
      "Galaxy A25 5G com tela Super AMOLED de 6.5\" e 120Hz, câmera tripla de 50MP, processador Exynos 1280 e conexão 5G ultrarrápida.",
    specs: [
      { label: "Tela", value: '6.5" Super AMOLED 120Hz' },
      { label: "Câmera", value: "50MP + 8MP + 2MP" },
      { label: "Bateria", value: "5000mAh" },
      { label: "Memória", value: "6GB RAM + 128GB" },
    ],
    badges: [
      { type: "desconto", label: "-20%" },
      { type: "parcela", label: "48x sem juros" },
    ],
    rating: 4.6,
    reviewCount: 1567,
  },

  // ── ELETRODOMÉSTICOS ──
  {
    id: "eletro-1",
    name: "Geladeira Consul Frost Free 300L",
    category: "eletrodomesticos",
    price: 2499.9,
    originalPrice: 3199.9,
    maxInstallments: 48,
    image: "🧊",
    imageBg: "#EEF2F7",
    description:
      "Geladeira Consul Frost Free 300 litros com prateleiras reguláveis, gaveta para frutas e legumes, porta-latas e design compacto. Classificação A de energia.",
    specs: [
      { label: "Capacidade", value: "300 litros" },
      { label: "Tipo", value: "Frost Free" },
      { label: "Energia", value: "Classe A" },
      { label: "Cor", value: "Branco" },
    ],
    badges: [
      { type: "desconto", label: "-22%" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.4,
    reviewCount: 892,
  },
  {
    id: "eletro-2",
    name: "Máquina de Lavar Electrolux 11kg",
    category: "eletrodomesticos",
    price: 1899.9,
    originalPrice: 2399.9,
    maxInstallments: 48,
    image: "🫧",
    imageBg: "#E6FBF8",
    description:
      "Lavadora Electrolux Essential Care 11kg com 12 programas de lavagem, tecnologia Jet&Clean e cesto inox. Lava mais roupas em menos tempo.",
    specs: [
      { label: "Capacidade", value: "11kg" },
      { label: "Programas", value: "12 programas" },
      { label: "Voltagem", value: "127V/220V" },
      { label: "Cor", value: "Branco" },
    ],
    badges: [
      { type: "desconto", label: "-21%" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.5,
    reviewCount: 1345,
  },
  {
    id: "eletro-3",
    name: "Fogão Brastemp 4 Bocas Inox",
    category: "eletrodomesticos",
    price: 1299.9,
    originalPrice: 1699.9,
    maxInstallments: 36,
    image: "🔥",
    imageBg: "#FFE8DA",
    description:
      "Fogão Brastemp 4 bocas com acendimento automático, mesa em inox, forno de 56 litros com grill e timer. Acabamento premium.",
    specs: [
      { label: "Bocas", value: "4 bocas" },
      { label: "Forno", value: "56 litros" },
      { label: "Material", value: "Inox" },
      { label: "Recursos", value: "Timer + Grill" },
    ],
    badges: [
      { type: "desconto", label: "-24%" },
      { type: "promo", label: "⭐ Oferta" },
    ],
    rating: 4.6,
    reviewCount: 678,
  },
  {
    id: "eletro-4",
    name: "Microondas Panasonic 32L",
    category: "eletrodomesticos",
    price: 699.9,
    originalPrice: 899.9,
    maxInstallments: 24,
    image: "📡",
    imageBg: "#FFF4CC",
    description:
      "Micro-ondas Panasonic 32 litros com 10 níveis de potência, descongelamento rápido, receitas pré-programadas e painel digital.",
    specs: [
      { label: "Capacidade", value: "32 litros" },
      { label: "Potência", value: "900W" },
      { label: "Funções", value: "10 receitas pré-programadas" },
      { label: "Cor", value: "Inox" },
    ],
    badges: [
      { type: "desconto", label: "-22%" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.3,
    reviewCount: 432,
  },

  // ── MÓVEIS ──
  {
    id: "mov-1",
    name: "Sofá Retrátil e Reclinável 3 Lugares",
    category: "moveis",
    price: 1799.9,
    originalPrice: 2499.9,
    maxInstallments: 48,
    image: "🛋️",
    imageBg: "#FFF4CC",
    description:
      "Sofá retrátil e reclinável para 3 lugares com espuma D33 de alta densidade, tecido suede e estrutura em madeira maciça. Conforto e durabilidade.",
    specs: [
      { label: "Lugares", value: "3 lugares" },
      { label: "Espuma", value: "D33 alta densidade" },
      { label: "Tecido", value: "Suede" },
      { label: "Largura", value: "230cm" },
    ],
    badges: [
      { type: "desconto", label: "-28%" },
      { type: "frete", label: "Frete Grátis" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.4,
    reviewCount: 756,
  },
  {
    id: "mov-2",
    name: "Guarda-Roupa 6 Portas com Espelho",
    category: "moveis",
    price: 1499.9,
    originalPrice: 1999.9,
    maxInstallments: 48,
    image: "🚪",
    imageBg: "#EEF2F7",
    description:
      "Guarda-roupa 6 portas com espelho central, prateleiras e cabideiros internos, pés de apoio e acabamento em MDP. Espaço para toda a família.",
    specs: [
      { label: "Portas", value: "6 portas + espelho" },
      { label: "Material", value: "MDP 15mm" },
      { label: "Dimensões", value: "207 x 160 x 53cm" },
      { label: "Cor", value: "Nogal/Branco" },
    ],
    badges: [
      { type: "desconto", label: "-25%" },
      { type: "parcela", label: "48x sem juros" },
    ],
    rating: 4.2,
    reviewCount: 543,
  },
  {
    id: "mov-3",
    name: "Cama Box Casal com Colchão Ortopédico",
    category: "moveis",
    price: 999.9,
    originalPrice: 1399.9,
    maxInstallments: 36,
    image: "🛏️",
    imageBg: "#E6FBF8",
    description:
      "Conjunto cama box casal com colchão ortopédico D45, molas ensacadas, tecido antialérgico e pillow top. Noites de sono perfeitas.",
    specs: [
      { label: "Tamanho", value: "Casal (138x188cm)" },
      { label: "Espuma", value: "D45 Ortopédica" },
      { label: "Molas", value: "Ensacadas" },
      { label: "Altura", value: "62cm total" },
    ],
    badges: [
      { type: "desconto", label: "-29%" },
      { type: "promo", label: "⚡ Relâmpago" },
    ],
    rating: 4.5,
    reviewCount: 1023,
  },
  {
    id: "mov-4",
    name: 'Rack para TV até 55" com Painel',
    category: "moveis",
    price: 599.9,
    originalPrice: 799.9,
    maxInstallments: 24,
    image: "📺",
    imageBg: "#FFE8DA",
    description:
      "Rack para TV até 55 polegadas com painel, nichos decorativos, passagem para fios e acabamento em MDP. Moderno e funcional.",
    specs: [
      { label: "TV máx.", value: '55"' },
      { label: "Material", value: "MDP 15mm" },
      { label: "Dimensões", value: "180 x 135 x 40cm" },
      { label: "Cor", value: "Nogueira/Off White" },
    ],
    badges: [
      { type: "desconto", label: "-25%" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.3,
    reviewCount: 389,
  },

  // ── ELETRÔNICOS ──
  {
    id: "ele-1",
    name: 'Smart TV Samsung 43" Crystal UHD 4K',
    category: "eletronicos",
    price: 1899.9,
    originalPrice: 2499.9,
    maxInstallments: 48,
    image: "📺",
    imageBg: "#EEF2F7",
    description:
      "Smart TV Samsung 43 polegadas Crystal UHD 4K com processador Crystal 4K, HDR, Tizen OS, Bluetooth, Wi-Fi e controle com comando de voz.",
    specs: [
      { label: "Tela", value: '43" Crystal UHD 4K' },
      { label: "Sistema", value: "Tizen OS" },
      { label: "HDR", value: "HDR10+" },
      { label: "Conexões", value: "3 HDMI + 1 USB" },
    ],
    badges: [
      { type: "desconto", label: "-24%" },
      { type: "frete", label: "Frete Grátis" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.6,
    reviewCount: 2341,
  },
  {
    id: "ele-2",
    name: "Notebook Lenovo IdeaPad 15.6\" i5 8GB 256GB SSD",
    category: "eletronicos",
    price: 2699.9,
    originalPrice: 3299.9,
    maxInstallments: 48,
    image: "💻",
    imageBg: "#FFF5EF",
    description:
      "Notebook Lenovo IdeaPad com processador Intel Core i5, 8GB RAM, SSD 256GB, tela antirreflexo de 15.6\" Full HD e Windows 11.",
    specs: [
      { label: "Processador", value: "Intel Core i5-1235U" },
      { label: "Memória", value: "8GB DDR4" },
      { label: "Armazenamento", value: "256GB SSD NVMe" },
      { label: "Tela", value: '15.6" Full HD' },
    ],
    badges: [
      { type: "desconto", label: "-18%" },
      { type: "parcela", label: "48x sem juros" },
    ],
    rating: 4.4,
    reviewCount: 1567,
  },
  {
    id: "ele-3",
    name: "Fone Bluetooth JBL Tune 520BT",
    category: "eletronicos",
    price: 199.9,
    originalPrice: 299.9,
    maxInstallments: 12,
    image: "🎧",
    imageBg: "#E6FBF8",
    description:
      "Fone de ouvido Bluetooth JBL Tune 520BT com som JBL Pure Bass, até 57h de bateria, dobrável e leve. Conexão multipontos.",
    specs: [
      { label: "Bateria", value: "Até 57 horas" },
      { label: "Bluetooth", value: "5.3" },
      { label: "Tipo", value: "On-ear dobrável" },
      { label: "Peso", value: "147g" },
    ],
    badges: [
      { type: "desconto", label: "-33%" },
      { type: "promo", label: "⭐ Oferta" },
    ],
    rating: 4.5,
    reviewCount: 3421,
  },
  {
    id: "ele-4",
    name: "Tablet Samsung Galaxy Tab A9 64GB",
    category: "eletronicos",
    price: 1499.9,
    originalPrice: 1899.9,
    maxInstallments: 48,
    image: "📲",
    imageBg: "#FFF4CC",
    description:
      "Tablet Samsung Galaxy Tab A9 com tela de 8.7\" TFT, 64GB de armazenamento, 4GB RAM, bateria de 5100mAh e alto-falantes estéreo.",
    specs: [
      { label: "Tela", value: '8.7" TFT' },
      { label: "Memória", value: "4GB RAM + 64GB" },
      { label: "Bateria", value: "5100mAh" },
      { label: "Câmera", value: "8MP + 2MP frontal" },
    ],
    badges: [
      { type: "desconto", label: "-21%" },
      { type: "novo", label: "Novidade" },
    ],
    rating: 4.3,
    reviewCount: 876,
  },

  // ── MODA ──
  {
    id: "moda-1",
    name: "Tênis Nike Revolution 6",
    category: "moda",
    price: 299.9,
    originalPrice: 399.9,
    maxInstallments: 12,
    image: "👟",
    imageBg: "#CCF6F1",
    description:
      "Tênis Nike Revolution 6 com amortecimento em espuma macia, cabedal em mesh respirável e solado de borracha durável. Perfeito para o dia a dia e caminhadas.",
    specs: [
      { label: "Material", value: "Mesh respirável" },
      { label: "Solado", value: "Borracha" },
      { label: "Amortecimento", value: "Espuma macia" },
      { label: "Indicação", value: "Caminhada / Casual" },
    ],
    badges: [
      { type: "desconto", label: "-25%" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.6,
    reviewCount: 4523,
  },
  {
    id: "moda-2",
    name: "Jaqueta Jeans Feminina Oversized",
    category: "moda",
    price: 159.9,
    originalPrice: 219.9,
    maxInstallments: 10,
    image: "🧥",
    imageBg: "#EEF2F7",
    description:
      "Jaqueta jeans feminina oversized com lavagem média, bolsos frontais com botão, punho com botão e barra reta. Estilo atemporal.",
    specs: [
      { label: "Material", value: "100% Algodão" },
      { label: "Estilo", value: "Oversized" },
      { label: "Lavagem", value: "Média" },
      { label: "Tamanhos", value: "P ao GG" },
    ],
    badges: [
      { type: "desconto", label: "-27%" },
      { type: "novo", label: "Novidade" },
    ],
    rating: 4.4,
    reviewCount: 567,
  },
  {
    id: "moda-3",
    name: "Bolsa Feminina Couro Eco Estruturada",
    category: "moda",
    price: 129.9,
    originalPrice: 189.9,
    maxInstallments: 10,
    image: "👜",
    imageBg: "#FFE8DA",
    description:
      "Bolsa feminina em couro ecológico estruturada, com alça de mão e alça transversal removível, fecho com zíper e bolsos internos.",
    specs: [
      { label: "Material", value: "Couro ecológico" },
      { label: "Dimensões", value: "30 x 22 x 12cm" },
      { label: "Alças", value: "Mão + Transversal" },
      { label: "Fecho", value: "Zíper" },
    ],
    badges: [
      { type: "desconto", label: "-32%" },
      { type: "promo", label: "⭐ Oferta" },
    ],
    rating: 4.3,
    reviewCount: 345,
  },
  {
    id: "moda-4",
    name: "Relógio Casio Digital Vintage A168",
    category: "moda",
    price: 179.9,
    originalPrice: 249.9,
    maxInstallments: 10,
    image: "⌚",
    imageBg: "#FFF4CC",
    description:
      "Relógio Casio Vintage A168 com display digital iluminado, cronômetro, alarme, calendário automático e resistência à água. Um clássico.",
    specs: [
      { label: "Display", value: "Digital iluminado" },
      { label: "Resistência", value: "Água (WR)" },
      { label: "Bateria", value: "Até 7 anos" },
      { label: "Material", value: "Aço inoxidável" },
    ],
    badges: [
      { type: "desconto", label: "-28%" },
      { type: "hot", label: "🔥 Mais Vendido" },
    ],
    rating: 4.8,
    reviewCount: 6789,
  },

  // ── BELEZA ──
  {
    id: "bel-1",
    name: "Kit Maquiagem Completo 12 Peças",
    category: "beleza",
    price: 149.9,
    originalPrice: 219.9,
    maxInstallments: 10,
    image: "💄",
    imageBg: "#FFE8DA",
    description:
      "Kit completo de maquiagem com 12 peças: paleta de sombras, base líquida, corretivo, pó compacto, blush, batom, máscara para cílios e pincéis profissionais.",
    specs: [
      { label: "Peças", value: "12 itens" },
      { label: "Inclui", value: "Paleta + Base + Pincéis" },
      { label: "Tipo de pele", value: "Todos os tipos" },
      { label: "Durabilidade", value: "Longa duração" },
    ],
    badges: [
      { type: "desconto", label: "-32%" },
      { type: "promo", label: "⭐ Oferta" },
    ],
    rating: 4.4,
    reviewCount: 2345,
  },
  {
    id: "bel-2",
    name: "Perfume Importado Feminino 100ml",
    category: "beleza",
    price: 249.9,
    originalPrice: 349.9,
    maxInstallments: 12,
    image: "🧴",
    imageBg: "#E6FBF8",
    description:
      "Perfume importado feminino com notas florais e amadeiradas, fixação de longa duração (12h+), frasco de 100ml. Elegante e sofisticado.",
    specs: [
      { label: "Volume", value: "100ml" },
      { label: "Concentração", value: "Eau de Parfum" },
      { label: "Notas", value: "Floral amadeirado" },
      { label: "Fixação", value: "12h+" },
    ],
    badges: [
      { type: "desconto", label: "-29%" },
      { type: "frete", label: "Frete Grátis" },
    ],
    rating: 4.7,
    reviewCount: 1234,
  },
  {
    id: "bel-3",
    name: "Chapinha Mondial Pro Tourmaline Ion",
    category: "beleza",
    price: 99.9,
    originalPrice: 149.9,
    maxInstallments: 10,
    image: "💇",
    imageBg: "#FFF5EF",
    description:
      "Prancha alisadora Mondial Pro com placas de tourmaline e íons negativos, temperatura ajustável até 230°C, bivolt e cabo giratório 360°.",
    specs: [
      { label: "Placas", value: "Tourmaline + Íons" },
      { label: "Temperatura", value: "Até 230°C" },
      { label: "Voltagem", value: "Bivolt" },
      { label: "Cabo", value: "Giratório 360°" },
    ],
    badges: [
      { type: "desconto", label: "-33%" },
      { type: "promo", label: "⚡ Relâmpago" },
    ],
    rating: 4.2,
    reviewCount: 876,
  },
  {
    id: "bel-4",
    name: "Kit Skincare Facial 5 Peças",
    category: "beleza",
    price: 189.9,
    originalPrice: 269.9,
    maxInstallments: 10,
    image: "✨",
    imageBg: "#CCF6F1",
    description:
      "Kit completo de skincare facial com gel de limpeza, tônico, sérum de vitamina C, hidratante com FPS 50 e máscara facial. Rotina completa de cuidados.",
    specs: [
      { label: "Peças", value: "5 itens" },
      { label: "Inclui", value: "Limpeza + Sérum + FPS" },
      { label: "Tipo de pele", value: "Todos os tipos" },
      { label: "Resultados", value: "A partir de 15 dias" },
    ],
    badges: [
      { type: "desconto", label: "-30%" },
      { type: "novo", label: "Novidade" },
    ],
    rating: 4.6,
    reviewCount: 1567,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(
  category: string
): Product[] {
  return products.filter((p) => p.category === category);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getOfertasDoDia(): Product[] {
  return [...products]
    .sort(
      (a, b) =>
        (b.originalPrice - b.price) / b.originalPrice -
        (a.originalPrice - a.price) / a.originalPrice
    )
    .slice(0, 8);
}

export function getMaisVendidos(): Product[] {
  return [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);
}
