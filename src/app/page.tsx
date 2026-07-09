import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Catalog from "@/components/Catalog";
import HowItWorks from "@/components/HowItWorks";
import WhereToBuy from "@/components/WhereToBuy";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-offwhite">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Catalog />
        <HowItWorks />
        <WhereToBuy />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
