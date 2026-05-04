import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/constants";

export default function FAQ() {
    return (
        <section
            id="faq"
            data-testid="faq-section"
            className="relative py-24 md:py-32 px-5 md:px-8"
        >
            <div className="mx-auto max-w-4xl">
                <div className="mb-12">
                    <div className="text-xs tracking-[0.3em] uppercase text-abf-gold font-semibold mb-4">
                        FAQ
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter">
                        Straight <span className="text-gradient-warm">answers</span>.
                    </h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((f, i) => (
                        <AccordionItem
                            key={i}
                            value={`item-${i}`}
                            data-testid={`faq-item-${i}`}
                            className="border-white/10"
                        >
                            <AccordionTrigger className="text-left font-display text-lg md:text-xl text-white hover:no-underline hover:text-abf-gold py-5">
                                {f.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-white/65 text-base leading-relaxed pb-5">
                                {f.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
