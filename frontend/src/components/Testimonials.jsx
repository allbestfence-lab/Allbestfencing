import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";

export default function Testimonials() {
    return (
        <section
            id="reviews"
            data-testid="testimonials-section"
            className="relative py-24 md:py-32 px-5 md:px-8 bg-abf-bg3"
        >
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-14 md:mb-20">
                    <div className="text-xs tracking-[0.3em] uppercase text-abf-wood font-bold mb-4">
                        Trusted by 500+ Homeowners
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-slate-900">
                        Real stories. <span className="text-gradient-warm">Real results.</span>
                    </h2>
                    <div className="mt-6 inline-flex items-center gap-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="w-5 h-5 fill-abf-orange text-abf-orange"
                                />
                            ))}
                        </div>
                        <span className="text-lg font-display font-bold text-slate-900">
                            4.9 / 5.0
                        </span>
                        <span className="text-slate-500 text-sm">
                            · 500+ Google reviews
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {TESTIMONIALS.map((t, i) => (
                        <motion.blockquote
                            key={t.name}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.6, delay: i * 0.07 }}
                            data-testid={`testimonial-${i}`}
                            className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 hover:border-abf-orange/40 hover:shadow-lg transition-all"
                        >
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star
                                        key={j}
                                        className="w-4 h-4 fill-abf-orange text-abf-orange"
                                    />
                                ))}
                            </div>
                            <p className="font-serif-display italic text-lg md:text-xl leading-snug text-slate-800 mb-5">
                                “{t.quote}”
                            </p>
                            <footer>
                                <div className="font-semibold text-slate-900">
                                    {t.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {t.role}
                                </div>
                            </footer>
                        </motion.blockquote>
                    ))}
                </div>
            </div>
        </section>
    );
}
