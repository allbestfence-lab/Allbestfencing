import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SERVICES } from "@/lib/constants";

export default function Services() {
    return (
        <section id="services" className="relative py-24 md:py-32 px-5 md:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl mb-14 md:mb-20">
                    <div className="text-xs tracking-[0.3em] uppercase text-abf-gold font-semibold mb-4">
                        What we craft
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl font-bold leading-[0.95] tracking-tighter">
                        Premium <span className="text-gradient-warm">solutions</span>, engineered for BC weather.
                    </h2>
                    <p className="mt-5 text-white/60 text-base md:text-lg max-w-xl">
                        Six specialised product lines — each hand-picked for
                        longevity, aesthetics and performance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[260px] md:auto-rows-[300px] gap-4">
                    {SERVICES.map((s, i) => (
                        <motion.article
                            key={s.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.6, delay: i * 0.07 }}
                            data-testid={`service-card-${s.id}`}
                            className={`group relative rounded-2xl overflow-hidden border border-white/5 hover:border-abf-orange/50 transition-all duration-500 cursor-pointer ${s.span || "md:col-span-4"}`}
                        >
                            <img
                                src={s.image}
                                alt={s.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a] via-[#060d1a]/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#ff7a00]/0 group-hover:to-[#ff7a00]/15 transition-colors duration-500" />

                            <div className="relative z-10 h-full p-6 md:p-7 flex flex-col justify-end">
                                <h3 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
                                    {s.title}
                                </h3>
                                <p className="mt-2 text-white/70 text-sm md:text-base">
                                    {s.short}
                                </p>
                                <div className="mt-4 inline-flex items-center gap-1.5 text-abf-gold text-sm font-semibold opacity-80 group-hover:opacity-100 group-hover:gap-2.5 transition-all">
                                    Learn more
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
