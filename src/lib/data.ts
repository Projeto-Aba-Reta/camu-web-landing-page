export type Product = {
  name: string;
  market: string;
  href: string;
};

export const products: Product[] = [
  { name: "Miniatura RPG", market: "Elo7", href: "#" },
  { name: "Action figure geek", market: "Shopee", href: "#" },
  { name: "Suporte gamer", market: "Mercado Livre", href: "#" },
  { name: "Diorama colecionável", market: "Etsy", href: "#" },
];

export type Step = {
  n: string;
  title: string;
  desc: string;
};

export const steps: Step[] = [
  { n: "1", title: "Modelagem", desc: "Sua ideia vira arquivo 3D." },
  { n: "2", title: "Impressão", desc: "Camada por camada, com precisão." },
  { n: "3", title: "Acabamento", desc: "Lixa, pintura e capricho." },
  { n: "4", title: "Envio", desc: "Embalado e a caminho de você." },
];

export type Marketplace = {
  name: string;
  href: string;
};

export const marketplaces: Marketplace[] = [
  { name: "Mercado Livre", href: "#" },
  { name: "Shopee", href: "#" },
  { name: "Elo7", href: "#" },
  { name: "Etsy", href: "#" },
];

export type Testimonial = {
  quote: string;
  author: string;
};

// Exemplo — substituir por depoimentos reais.
export const testimonials: Testimonial[] = [
  { quote: "Chegou idêntico ao render, virei cliente fixo.", author: "Cliente exemplo" },
  { quote: "Acabamento surreal pra miniatura de RPG.", author: "Cliente exemplo" },
  { quote: "Atendimento rápido e produto impecável.", author: "Cliente exemplo" },
];

export const navLinks = [
  { label: "Sobre", href: "#sobre" },
  { label: "Catálogo", href: "#catalogo" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Onde comprar", href: "#onde-comprar" },
  { label: "Contato", href: "#contato" },
];

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "WhatsApp", href: "https://wa.me/" },
  { label: "E-mail", href: "mailto:contato@camu.com.br" },
];
