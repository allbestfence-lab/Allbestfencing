import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award, MapPin } from "lucide-react";

const ITEMS = [
    {
        icon: ShieldCheck,
        title: "Licensed & Insured",
        desc: "$2M liability + WorkSafeBC compliant crews",
    },
    {
        icon: Clock,
        title: "10+ Years Experience",
        desc: "Thousands of installations across BC",
    },
    {
        icon: Award,
        title: "5-Star Rated",
        desc: "500+ verified Google reviews",
    },
    {
        icon: MapPin,
        title: "Local Vancouver Experts",
        desc: "Surrey HQ — service within 30 miles",
    },
];

export default function WhyChooseUs() {
    return (
        <section className="relative py-24 md:py-32 px-5 md:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid md:grid-cols-4 gap-4 md:gap-5">
                    {ITEMS.map(({ icon: Icon, title, desc }, i) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                            data-testid={`trust-card-${i}`}
                            className="group relative rounded-2xl border border-white/5 bg-abf-bg2/50 p-6 md:p-7 hover:border-abf-orange/40 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-abf-orange to-abf-gold flex items-center justify-center mb-4 shadow-lg shadow-abf-orange/20">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-display text-lg font-semibold text-white">
                                {title}
                            </h3>
                            <p className="text-sm text-white/55 mt-1.5 leading-relaxed">
                                {desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
