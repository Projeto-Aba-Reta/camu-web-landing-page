import type { Metadata } from "next";
import LoginForm from "@/components/store/LoginForm";

export const metadata: Metadata = {
  title: "Entrar na minha conta",
  description: "Acompanhe seus pedidos e o status de cada um pela sua conta Camu.",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <section className="mx-auto flex max-w-md flex-col px-6 py-14 sm:py-20">
      <h1 className="mb-2 font-heading text-2xl font-extrabold text-charcoal sm:text-3xl">
        Entrar na minha conta
      </h1>
      <p className="mb-7 font-sans text-sm leading-relaxed text-charcoal/65">
        Digite o e-mail que você usou no pedido. A gente manda um link de acesso —
        sem senha.
      </p>

      {erro === "link_invalido" && (
        <div className="mb-5 rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          Esse link expirou ou já foi usado. Peça um novo abaixo.
        </div>
      )}

      <LoginForm />
    </section>
  );
}
