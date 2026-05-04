import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

const NAV = [
    { label: "Services", href: "#services" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Areas", href: "#areas" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (href) => {
        setOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <header
            data-testid="site-header"
            className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
                scrolled
                    ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm"
                    : "bg-white/70 backdrop-blur-md border-b border-slate-200/60"
            }`}
        >
            <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
                <a
                    href="#top"
                    data-testid="header-logo"
                    className="flex items-center gap-3"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                >
                    <img
                        src={BUSINESS.logo}
                        alt="All Best Fencing logo"
                        className="h-12 md:h-14 w-auto object-contain"
                    />
                    <div className="leading-tight hidden sm:block">
                        <div className="font-display text-lg md:text-xl font-bold tracking-tight text-slate-900">
                            All Best Fencing
                        </div>
                        <div className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-abf-orange font-semibold">
                            Built Strong · Secured Right
                        </div>
                    </div>
                </a>

                <nav className="hidden lg:flex items-center gap-8">
                    {NAV.map((n) => (
                        <button
                            key={n.href}
                            data-testid={`nav-${n.label.toLowerCase()}`}
                            onClick={() => scrollTo(n.href)}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {n.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <a
                        href={`tel:${BUSINESS.phoneTel}`}
                        data-testid="header-call-btn"
                        className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-abf-orange transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        {BUSINESS.phoneDisplay}
                    </a>
                    <button
                        onClick={() => scrollTo("#quote")}
                        data-testid="header-quote-btn"
                        className="cta-glow hidden md:inline-flex bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                    >
                        Get Free Quote
                    </button>
                    <button
                        className="lg:hidden p-2 text-slate-800"
                        onClick={() => setOpen((v) => !v)}
                        data-testid="mobile-menu-toggle"
                        aria-label="Menu"
                    >
                        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
                    <div className="px-5 py-4 flex flex-col gap-3">
                        {NAV.map((n) => (
                            <button
                                key={n.href}
                                onClick={() => scrollTo(n.href)}
                                className="text-left text-slate-700 py-2 border-b border-slate-100"
                            >
                                {n.label}
                            </button>
                        ))}
                        <a
                            href={`tel:${BUSINESS.phoneTel}`}
                            className="text-left text-abf-orange font-semibold py-2 border-b border-slate-100 flex items-center gap-2"
                        >
                            <Phone className="w-4 h-4" />
                            {BUSINESS.phoneDisplay}
                        </a>
                        <button
                            onClick={() => scrollTo("#quote")}
                            className="mt-2 w-full bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-semibold py-3 rounded-full"
                        >
                            Get Free Quote
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
