import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Award, Zap, PhoneCall } from "lucide-react";
import useProgressiveCapture from "@/hooks/useProgressiveCapture";
import { submitFullLead } from "@/lib/api";
import { toast } from "sonner";
import { BUSINESS } from "@/lib/constants";

export default function Hero() {
    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [sending, setSending] = useState(false);

    useProgressiveCapture(form);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) {
            toast.error("Please enter your name and phone");
            return;
        }
        setSending(true);
        try {
            await submitFullLead({
                name: form.name,
                phone: form.phone,
                email: form.email || null,
            });
            toast.success("Thanks! We'll call you within 2 hours.");
            setForm({ name: "", phone: "", email: "" });
        } catch {
            toast.error("Something went wrong — please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <section
            id="top"
            data-testid="hero-section"
            className="relative min-h-screen overflow-hidden pt-28 md:pt-36 pb-20"
        >
            {/* Background image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.pexels.com/photos/4948974/pexels-photo-4948974.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1920"
                    alt="Premium wood fencing installation"
                    className="w-full h-full object-cover"
                />
                {/* Light cream overlay — strong on left for text legibility, lighter on right to show imagery */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#fafaf7] via-[#fafaf7]/85 to-[#fafaf7]/20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fafaf7]/40 via-transparent to-[#fafaf7]/70" />
            </div>

            {/* Decorative elements */}
            <div className="absolute top-36 right-[-10%] w-[500px] h-[500px] bg-abf-orange/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-abf-wood/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-12 gap-10 items-center">
                {/* Left */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:col-span-7"
                >
                    <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-abf-wood font-semibold mb-6">
                        <span className="w-8 h-px bg-abf-wood/60" />
                        Greater Vancouver · Since 2014
                    </div>
                    <h1
                        className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[84px] leading-[0.95] font-bold tracking-tighter text-slate-900"
                        data-testid="hero-headline"
                    >
                        We don't just build fences.
                        <br />
                        <span className="text-gradient-warm">
                            We build security.
                        </span>
                    </h1>
                    <p className="mt-7 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
                        Premium wood, aluminum, privacy, vinyl and custom gate
                        installations engineered to elevate your property's
                        security and curb appeal.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4 fill-abf-orange text-abf-orange"
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">5-Star Rated</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-abf-orange" />
                            Licensed & Insured
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Award className="w-4 h-4 text-abf-orange" />
                            10+ Years Experience
                        </div>
                    </div>

                    <a
                        href={`tel:${BUSINESS.phoneTel}`}
                        className="mt-10 inline-flex items-center gap-3 text-slate-900 hover:text-abf-orange transition-colors"
                        data-testid="hero-call-link"
                    >
                        <div className="w-11 h-11 rounded-full bg-abf-orange/10 flex items-center justify-center">
                            <PhoneCall className="w-5 h-5 text-abf-orange" />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Call us now</div>
                            <div className="font-display font-bold text-xl">{BUSINESS.phoneDisplay}</div>
                        </div>
                    </a>
                </motion.div>

                {/* Right: Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="lg:col-span-5"
                >
                    <form
                        onSubmit={onSubmit}
                        data-testid="hero-quote-form"
                        className="bg-white rounded-2xl p-6 md:p-7 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] border border-slate-200"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-display text-2xl font-bold text-slate-900">
                                    Get Free Quote
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Start your project today. No obligation.
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-1 text-[11px] text-abf-orange font-bold bg-abf-orange/10 border border-abf-orange/20 px-2.5 py-1 rounded-full">
                                <Zap className="w-3 h-3 fill-abf-orange" />
                                2-HR RESPONSE
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            <input
                                data-testid="hero-form-name"
                                type="text"
                                placeholder="Your Name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="w-full bg-slate-50 border border-slate-200 focus:border-abf-orange focus:bg-white focus:ring-2 focus:ring-abf-orange/20 transition-all rounded-lg px-4 py-3 outline-none placeholder:text-slate-400 text-slate-900"
                            />
                            <input
                                data-testid="hero-form-phone"
                                type="tel"
                                placeholder="Phone Number"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="w-full bg-slate-50 border border-slate-200 focus:border-abf-orange focus:bg-white focus:ring-2 focus:ring-abf-orange/20 transition-all rounded-lg px-4 py-3 outline-none placeholder:text-slate-400 text-slate-900"
                            />
                            <input
                                data-testid="hero-form-email"
                                type="email"
                                placeholder="Email Address (optional)"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="w-full bg-slate-50 border border-slate-200 focus:border-abf-orange focus:bg-white focus:ring-2 focus:ring-abf-orange/20 transition-all rounded-lg px-4 py-3 outline-none placeholder:text-slate-400 text-slate-900"
                            />
                            <button
                                type="submit"
                                disabled={sending}
                                data-testid="hero-form-submit"
                                className="cta-glow w-full bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-bold text-base py-3.5 rounded-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:translate-y-0"
                            >
                                {sending ? "Sending…" : "Get Instant Quote"}
                            </button>
                        </div>

                        <p className="mt-4 text-center text-xs text-slate-500">
                            <Zap className="inline w-3 h-3 -mt-0.5 mr-1 text-abf-orange fill-abf-orange" />
                            Response within 2 hours guaranteed
                        </p>
                    </form>
                </motion.div>
            </div>
        </section>
    );
}
