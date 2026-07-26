import StoreNav from "@/components/store/StoreNav";
import Footer from "@/components/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-offwhite">
      <StoreNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
