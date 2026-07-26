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
];

export type Testimonial = {
  quote: string;
  author: string;
};

export const testimonials: Testimonial[] = [
  { quote: "Chegou idêntico ao render, virei cliente fixo.", author: "Cliente exemplo" },
  { quote: "Acabamento surreal pra miniatura de RPG.", author: "Cliente exemplo" },
  { quote: "Atendimento rápido e produto impecável.", author: "Cliente exemplo" },
];

export const navLinks = [
  { label: "Sobre", href: "#sobre" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Contato", href: "#contato" },
];

/** Mensagem já preenchida no WhatsApp para identificar que o contato veio do site. */
export const whatsappGreeting =
  "Oi! Vim pelo site da Camu 3D e queria saber mais sobre as impressões.";

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/camu3d" },
  {
    label: "WhatsApp",
    href: `https://wa.me/5511912581464?text=${encodeURIComponent(whatsappGreeting)}`,
  },
  { label: "E-mail", href: "mailto:camu.3dprint@gmail.com" },
];
