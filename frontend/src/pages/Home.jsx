import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Services from "@/components/Services";
import ServiceAreaMarquee from "@/components/ServiceAreaMarquee";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import QuoteSection from "@/components/QuoteSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function Home() {
    return (
        <div data-testid="home-page" className="bg-abf-bg text-white">
            <Header />
            <main>
                <Hero />
                <WhyChooseUs />
                <Services />
                <ServiceAreaMarquee />
                <Portfolio />
                <Testimonials />
                <QuoteSection />
                <FAQ />
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
