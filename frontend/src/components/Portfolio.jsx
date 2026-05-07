import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PORTFOLIO } from "@/lib/constants";
import { listPublicPhotos, absoluteUrl } from "@/lib/api";

const CATEGORIES = ["All", "Wood Fence", "Metal Fence", "Chain-link", "Vinyl/PVC", "Glass Railing", "Gates"];

export default function Portfolio() {
    const [photos, setPhotos] = useState([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        listPublicPhotos(filter)
            .then((data) => {
                if (cancelled) return;
                setPhotos(data.photos || []);
            })
            .catch(() => {
                if (cancelled) return;
                setPhotos([]);
            })
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [filter]);

    // Fallback to legacy hard-coded gallery if no admin photos uploaded yet
    const items = photos.length > 0
        ? photos.map((p) => ({ src: absoluteUrl(p.url), caption: p.caption, id: p.id }))
        : (filter === "All" ? PORTFOLIO.map((src, i) => ({ src, caption: null, id: `legacy-${i}` })) : []);

    return (
        <section
            id="portfolio"
            data-testid="portfolio-section"
            className="relative py-24 md:py-32 px-5 md:px-8 bg-white"
        >
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
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

                {/* Category filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setFilter(c)}
                            data-testid={`portfolio-filter-${c.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                filter === c
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        No photos in this category yet — check back soon.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                        {items.map((item, i) => (
                            <motion.button
                                key={item.id}
                                type="button"
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.4) }}
                                onClick={() => setLightbox(item)}
                                className={`group relative overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-shadow text-left ${
                                    i === 0 && items.length > 4 ? "md:col-span-2 md:row-span-2" : ""
                                }`}
                                data-testid={`portfolio-item-${i}`}
                            >
                                <img
                                    src={item.src}
                                    alt={item.caption || `Fence installation ${i + 1}`}
                                    className="w-full h-full object-cover aspect-[4/3] md:aspect-auto group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {item.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.caption}
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-5 cursor-zoom-out"
                    >
                        <button
                            type="button"
                            onClick={() => setLightbox(null)}
                            className="absolute top-5 right-5 text-white/80 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={lightbox.src}
                            alt={lightbox.caption || ""}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {lightbox.caption && (
                            <div className="absolute bottom-6 left-0 right-0 text-center text-white/90 text-sm font-medium">
                                {lightbox.caption}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
