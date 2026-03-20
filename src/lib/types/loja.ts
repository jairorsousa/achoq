export type ProductCategory =
  | "celulares"
  | "eletrodomesticos"
  | "moveis"
  | "eletronicos"
  | "moda"
  | "beleza";

export type BadgeType =
  | "promo"
  | "novo"
  | "hot"
  | "frete"
  | "desconto"
  | "parcela";

export interface Badge {
  type: BadgeType;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice: number;
  maxInstallments: number;
  image: string;
  imageBg: string;
  description: string;
  specs: { label: string; value: string }[];
  badges: Badge[];
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  slug: ProductCategory;
  name: string;
  icon: string;
  color: string;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function calcDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

export function calcInstallment(price: number, installments: number): number {
  return price / installments;
}
