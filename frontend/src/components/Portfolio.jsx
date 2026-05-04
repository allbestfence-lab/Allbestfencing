import { motion } from "framer-motion";
import { PORTFOLIO } from "@/lib/constants";

export default function Portfolio() {
    return (
        <section
            id="portfolio"
            data-testid="portfolio-section"
            className="relative py-24 md:py-32 px-5 md:px-8 bg-white"
        >
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16 gap-6">
                    <div className="max-w-xl">
                        <div className="text-xs tracking-[0.3em] uppercase text-abf-wood font-bold mb-4">
                            Portfolio
                        </div>
                        <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-slate-900">
                            Our recent <span className="text-gradient-warm">installations</span>.
                        </h2>
                    </div>
                    <p className="text-slate-600 md:max-w-sm text-base md:text-lg">
                        A selection of residential and commercial projects
                        delivered across Greater Vancouver — all installed by
                        our in-house crews.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {PORTFOLIO.map((src, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                            className={`group relative overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-shadow ${
                                i === 0 ? "md:col-span-2 md:row-span-2" : ""
                            }`}
                            data-testid={`portfolio-item-${i}`}
                        >
                            <img
                                src={src}
                                alt={`Fence installation ${i + 1}`}
                                className="w-full h-full object-cover aspect-[4/3] md:aspect-auto group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
