/**
 * Conteúdo do hero da home — a oferta central é a miniatura do pet.
 * `priceFrom` e `leadTime` são placeholders: substituir pelos valores reais
 * (ver openspec/changes/melhora-funil-vendas-e-visual, perguntas em aberto).
 */
export const heroPet = {
  badge: "novidade · a miniatura do seu pet",
  title: ["A miniatura", "do seu pet, em 3D."],
  subtitle:
    "Manda 3 a 4 fotos e recebe uma prévia gerada por IA de como a peça vai ficar impressa. Você só paga se aprovar.",
  priceFrom: "a partir de R$ 60.00", // TODO: confirmar preço real
  leadTime: "pronto em ~10 dias úteis", // TODO: confirmar prazo real
  previewNote: "prévia grátis antes de pagar",
  primaryCta: { label: "Fazer a miniatura do meu pet", href: "/miniatura-pet" },
  secondaryCtas: [
    { label: "Ver peças prontas", href: "/loja" },
    { label: "Tenho outra ideia", href: "/encomenda" },
  ],
} as const;

/** Passos do fluxo da miniatura de pet — usados na home e em /miniatura-pet. */
export const petMiniatureSteps = [
  { n: "1", title: "Você manda as fotos", desc: "Nome, WhatsApp e 3-4 fotos do seu pet." },
  { n: "2", title: "A IA gera a prévia", desc: "Você vê como a miniatura ficaria impressa em 3D." },
  { n: "3", title: "Aprova e paga", desc: "Gostou? Paga no site. Não gostou? A gente tenta de novo." },
  { n: "4", title: "Tem mais pets?", desc: "Adicione várias miniaturas no mesmo pedido — cada par sai com desconto." },
] as const;

export type Product = {
  name: string;
  market: string;
  href: string;
};

export const products: Product[] = [
  { name: "Suporte gamer", market: "Mercado Livre", href: "#" },
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

/**
 * Depoimentos REAIS de clientes. Vazio até termos autorização de uso —
 * o componente <Testimonials/> não renderiza nada enquanto estiver vazio.
 * Não repovoar com exemplos fictícios.
 */
export const testimonials: Testimonial[] = [];

/**
 * Galeria de peças entregues (fotos reais). Vazia até o usuário fornecer as
 * imagens (colocar em public/images/ e referenciar aqui). <ProvaSocial/> só
 * aparece quando há pelo menos uma.
 */
export type GalleryItem = { src: string; alt: string };
export const deliveredGallery: GalleryItem[] = [];

/** Nº de pedidos entregues, pra prova social. `null` esconde o contador. */
export const ordersDelivered: number | null = null; // TODO: preencher com número real

/** Sinais de confiança exibidos na faixa teal da home. */
export const trustItems = [
  {
    title: "Prévia antes de pagar",
    desc: "Você vê como fica e só fecha se aprovar.",
  },
  {
    title: "Pronto em ~10 dias úteis", // TODO: confirmar prazo real
    desc: "Modelagem, impressão e acabamento com capricho.",
  },
  {
    title: "Pagamento seguro",
    desc: "Pix ou cartão no ambiente do Mercado Pago.",
  },
] as const;

/** Perguntas frequentes da home. */
export const faqItems = [
  {
    q: "Quanto tempo demora pra ficar pronto?",
    a: "Em média ~10 dias úteis após a aprovação da prévia e a confirmação do pagamento. Peças maiores ou com pintura detalhada podem levar um pouco mais — a gente avisa antes.", // TODO: confirmar prazo real
  },
  {
    q: "De que material são feitas as peças?",
    a: "Impressão 3D em resina ou filamento, conforme o tamanho e o nível de detalhe. A miniatura do pet pode vir sem pintura ou pintada nas cores reais do bicho.",
  },
  {
    q: "E se a prévia não ficar boa?",
    a: "Você pode pedir uma nova tentativa antes de pagar qualquer coisa. Só seguimos pro pagamento quando você aprova uma das opções.",
  },
  {
    q: "Como acompanho meu pedido?",
    a: "Pelo e-mail que você informa no pedido: a gente manda um link de acesso (sem senha) pra sua conta, onde aparece o status de cada encomenda.",
  },
] as const;

/** Texto de prazo/frete exibido nos cards do catálogo. */
export const catalogInfo = {
  price: "a partir de R$ 60.00",
  leadTime: "produção em ~10 dias úteis", // TODO: confirmar prazo real
  shipping: "frete calculado no checkout",
} as const;

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
