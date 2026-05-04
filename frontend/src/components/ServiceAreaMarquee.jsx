import { SERVICE_AREAS } from "@/lib/constants";
import { MapPin } from "lucide-react";

export default function ServiceAreaMarquee() {
    const doubled = [...SERVICE_AREAS, ...SERVICE_AREAS];
    return (
        <section
            id="areas"
            data-testid="service-area-section"
            className="relative py-16 md:py-20 border-y border-slate-200 overflow-hidden bg-abf-bg3"
        >
            <div className="mx-auto max-w-7xl px-5 md:px-8 mb-10">
                <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-abf-orange" />
                    <span className="text-xs tracking-[0.3em] uppercase text-abf-wood font-bold">
                        Service Areas · 30-mile radius
                    </span>
                </div>
                <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tighter text-slate-900">
                    Proudly serving <span className="text-gradient-warm">Greater Vancouver</span>.
                </h2>
            </div>

            <div className="relative w-full overflow-hidden">
                <div
                    className="flex gap-12 md:gap-20 whitespace-nowrap marquee-track"
                    style={{ width: "max-content" }}
                >
                    {doubled.map((area, i) => (
                        <div
                            key={`${area}-${i}`}
                            className="flex items-center gap-4"
                        >
                            <span className="font-serif-display italic text-4xl md:text-6xl lg:text-7xl text-slate-800">
                                {area}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-abf-orange shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
