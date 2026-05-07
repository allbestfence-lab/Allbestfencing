import { BUSINESS, SERVICE_AREAS, SERVICES } from "@/lib/constants";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
    return (
        <footer
            data-testid="site-footer"
            className="relative pt-24 md:pt-32 pb-10 px-5 md:px-8 border-t border-slate-200 bg-slate-950 text-white overflow-hidden"
        >
            <div className="mx-auto max-w-7xl">
                <div className="grid md:grid-cols-4 gap-10 md:gap-8 mb-20">
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <img
                                src={BUSINESS.logoLight}
                                alt="All Best Fencing"
                                className="h-14 w-auto object-contain"
                            />
                            <div>
                                <div className="font-display text-lg font-bold">
                                    {BUSINESS.name}
                                </div>
                                <div className="text-[10px] tracking-[0.25em] uppercase text-abf-orange font-semibold">
                                    Built Strong
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Premium fencing & custom gate installations across
                            Greater Vancouver since 2014. Licensed, insured and
                            proudly local.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs tracking-[0.3em] uppercase text-abf-orange font-bold mb-5">
                            Services
                        </h4>
                        <ul className="space-y-2.5">
                            {SERVICES.map((s) => (
                                <li key={s.id}>
                                    <a
                                        href="#services"
                                        className="text-sm text-slate-300 hover:text-white transition-colors"
                                    >
                                        {s.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs tracking-[0.3em] uppercase text-abf-orange font-bold mb-5">
                            Service Areas
                        </h4>
                        <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                            {SERVICE_AREAS.map((c) => (
                                <li key={c} className="text-sm text-slate-300">
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs tracking-[0.3em] uppercase text-abf-orange font-bold mb-5">
                            Contact
                        </h4>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href={`tel:${BUSINESS.phoneTel}`}
                                    data-testid="footer-phone"
                                    className="flex items-start gap-3 text-sm text-white hover:text-abf-orange transition-colors"
                                >
                                    <Phone className="w-4 h-4 mt-0.5 text-abf-orange shrink-0" />
                                    <span>
                                        {BUSINESS.phoneDisplay}
                                        <span className="block text-xs text-slate-400 mt-0.5">
                                            Call or text anytime
                                        </span>
                                    </span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`mailto:${BUSINESS.email}`}
                                    data-testid="footer-email"
                                    className="flex items-start gap-3 text-sm text-white hover:text-abf-orange transition-colors break-all"
                                >
                                    <Mail className="w-4 h-4 mt-0.5 text-abf-orange shrink-0" />
                                    {BUSINESS.email}
                                </a>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <MapPin className="w-4 h-4 mt-0.5 text-abf-orange shrink-0" />
                                Surrey, BC · 30-mile service radius
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="relative overflow-hidden mb-10">
                    <div
                        className="font-display font-bold tracking-tighter leading-none text-gradient-warm select-none"
                        style={{ fontSize: "clamp(3rem, 14vw, 13rem)" }}
                    >
                        ALL BEST FENCING
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
                    <div>
                        © {new Date().getFullYear()} All Best Fencing. All rights reserved.
                    </div>
                    <div>
                        Licensed · Insured · Serving Greater Vancouver since 2014
                    </div>
                </div>
            </div>
        </footer>
    );
}
