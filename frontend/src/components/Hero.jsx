import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Award, Zap } from "lucide-react";
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
            className="relative min-h-screen overflow-hidden noise"
        >
            {/* Background */}
            <div className="absolute inset-0">
                <img
                    src="https://static.prod-images.emergentagent.com/jobs/ae43fb83-34ed-4ae7-8c77-12e642c028c2/images/92d958ef9cd8a36a8d523aa544ac55e6f5dbcface03e36bfbc27dec3cd10cf2c.png"
                    alt="Architectural fencing backdrop"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#060d1a]/95 via-[#060d1a]/80 to-[#060d1a]/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,122,0,0.15),transparent_60%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8 pt-32 md:pt-40 pb-20 grid lg:grid-cols-12 gap-10 items-center">
                {/* Left */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:col-span-7"
                >
                    <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-abf-gold/90 mb-6">
                        <span className="w-8 h-px bg-abf-gold/60" />
                        Greater Vancouver · Since 2014
                    </div>
                    <h1
                        className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[88px] leading-[0.95] font-bold tracking-tighter"
                        data-testid="hero-headline"
                    >
                        We don't just build fences.
                        <br />
                        <span className="text-gradient-warm">
                            We build security.
                        </span>
                    </h1>
                    <p className="mt-7 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
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
                                        className="w-4 h-4 fill-abf-gold text-abf-gold"
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-white/80">5-Star Rated</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <ShieldCheck className="w-4 h-4 text-abf-gold" />
                            Licensed & Insured
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Award className="w-4 h-4 text-abf-gold" />
                            10+ Years Experience
                        </div>
                    </div>
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
                        className="glass rounded-2xl p-6 md:p-7 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-display text-2xl font-bold">
                                    Get Free Quote
                                </h3>
                                <p className="text-sm text-white/60 mt-1">
                                    Start your project today. No obligation.
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-1 text-[11px] text-abf-gold font-semibold bg-abf-gold/10 border border-abf-gold/30 px-2.5 py-1 rounded-full">
                                <Zap className="w-3 h-3 fill-abf-gold" />
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
                                className="w-full bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 transition-colors rounded-lg px-4 py-3 outline-none placeholder:text-white/40"
                            />
                            <input
                                data-testid="hero-form-phone"
                                type="tel"
                                placeholder="Phone Number"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="w-full bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 transition-colors rounded-lg px-4 py-3 outline-none placeholder:text-white/40"
                            />
                            <input
                                data-testid="hero-form-email"
                                type="email"
                                placeholder="Email Address (optional)"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="w-full bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 transition-colors rounded-lg px-4 py-3 outline-none placeholder:text-white/40"
                            />
                            <button
                                type="submit"
                                disabled={sending}
                                data-testid="hero-form-submit"
                                className="cta-glow w-full bg-gradient-to-r from-[#ff7a00] to-[#f9a03f] text-white font-bold text-base py-3.5 rounded-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:translate-y-0"
                            >
                                {sending ? "Sending…" : "Get Instant Quote"}
                            </button>
                        </div>

                        <p className="mt-4 text-center text-xs text-white/50">
                            <Zap className="inline w-3 h-3 -mt-0.5 mr-1 text-abf-gold fill-abf-gold" />
                            Response within 2 hours guaranteed
                        </p>
                        <p className="mt-2 text-center text-[11px] text-white/40">
                            Or call us directly:{" "}
                            <a
                                href={`tel:${BUSINESS.phoneTel}`}
                                className="text-abf-gold font-semibold hover:underline"
                            >
                                {BUSINESS.phoneDisplay}
                            </a>
                        </p>
                    </form>
                </motion.div>
            </div>
        </section>
    );
}
