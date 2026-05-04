import { useState } from "react";
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

    const scrollTo = (href) => {
        setOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <header
            data-testid="site-header"
            className="fixed top-0 inset-x-0 z-40 glass border-b border-white/5"
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
                        className="h-10 w-10 md:h-11 md:w-11 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div className="leading-tight">
                        <div className="font-display text-lg md:text-xl font-bold tracking-tight">
                            All Best Fencing
                        </div>
                        <div className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-abf-gold">
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
                            className="text-sm text-white/80 hover:text-white transition-colors"
                        >
                            {n.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <a
                        href={`tel:${BUSINESS.phoneTel}`}
                        data-testid="header-call-btn"
                        className="hidden md:flex items-center gap-2 text-sm text-white/90 hover:text-abf-gold transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        {BUSINESS.phoneDisplay}
                    </a>
                    <button
                        onClick={() => scrollTo("#quote")}
                        data-testid="header-quote-btn"
                        className="cta-glow hidden md:inline-flex bg-gradient-to-r from-[#ff7a00] to-[#f9a03f] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                    >
                        Get Free Quote
                    </button>
                    <button
                        className="lg:hidden p-2 text-white"
                        onClick={() => setOpen((v) => !v)}
                        data-testid="mobile-menu-toggle"
                        aria-label="Menu"
                    >
                        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="lg:hidden glass border-t border-white/10">
                    <div className="px-5 py-4 flex flex-col gap-3">
                        {NAV.map((n) => (
                            <button
                                key={n.href}
                                onClick={() => scrollTo(n.href)}
                                className="text-left text-white/90 py-2 border-b border-white/5"
                            >
                                {n.label}
                            </button>
                        ))}
                        <button
                            onClick={() => scrollTo("#quote")}
                            className="mt-2 w-full bg-gradient-to-r from-[#ff7a00] to-[#f9a03f] text-white font-semibold py-3 rounded-full"
                        >
                            Get Free Quote
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
