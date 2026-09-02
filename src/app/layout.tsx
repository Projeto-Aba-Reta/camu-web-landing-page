import type { Metadata } from "next";
import { Baloo_2, Space_Grotesk } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://camu3d.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Camu3d — Impressão 3D sob medida",
    template: "%s · Camu",
  },
  description:
    "A Camu transforma ideias em objetos com impressão 3D: miniaturas, action figures e decor geek. Leon, nosso camaleão, vira o que você precisar.",
  keywords: [
    "impressão 3D",
    "miniaturas RPG",
    "action figures",
    "geek",
    "colecionáveis",
    "Camu3d",
    "Camu",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Camu3d",
    title: "Camu3d — Impressão 3D sob medida",
    description:
      "Miniaturas, action figures e decor geek impressos em 3D. Compre pelo Mercado Livre, Shopee, Elo7 ou Etsy.",
    images: [
      {
        url: "/images/leon-waving.png",
        width: 676,
        height: 369,
        alt: "Leon, o camaleão mascote da Camu, acenando",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Camu3d — Impressão 3D sob medida",
    description:
      "Miniaturas, action figures e decor geek impressos em 3D pela Camu.",
    images: ["/images/leon-waving.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Camu3d",
  url: siteUrl,
  logo: `${siteUrl}/images/leon-logo.png`,
  description:
    "Empresa brasileira de impressão 3D sob medida: miniaturas, action figures e decor geek.",
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${baloo.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-offwhite text-charcoal">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
