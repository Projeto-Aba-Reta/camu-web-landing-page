import StoreNav from "@/components/store/StoreNav";
import Footer from "@/components/Footer";
import { PetCartProvider } from "@/lib/pet-miniature-cart";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <PetCartProvider>
      <div className="flex min-h-full flex-1 flex-col bg-offwhite">
        <StoreNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </PetCartProvider>
  );
}
