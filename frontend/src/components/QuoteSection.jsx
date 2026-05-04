import { useState } from "react";
import { toast } from "sonner";
import { submitFullLead } from "@/lib/api";
import useProgressiveCapture from "@/hooks/useProgressiveCapture";
import { SERVICES, SERVICE_AREAS, BUSINESS } from "@/lib/constants";

export default function QuoteSection() {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        service: "",
        city: "",
        project_details: "",
    });
    const [sending, setSending] = useState(false);

    useProgressiveCapture(form);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) {
            toast.error("Name and phone are required.");
            return;
        }
        setSending(true);
        try {
            await submitFullLead(form);
            toast.success("Thanks! Your quote request is in — we'll be in touch within 2 hours.");
            setForm({
                name: "",
                phone: "",
                email: "",
                service: "",
                city: "",
                project_details: "",
            });
        } catch {
            toast.error("Submission failed — please call us at " + BUSINESS.phoneDisplay);
        } finally {
            setSending(false);
        }
    };

    return (
        <section
            id="quote"
            data-testid="quote-section"
            className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden"
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.15),transparent_60%)]" />

            <div className="mx-auto max-w-5xl">
                <div className="text-center mb-12">
                    <div className="text-xs tracking-[0.3em] uppercase text-abf-gold font-semibold mb-4">
                        Request a quote
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter">
                        Tell us about your <span className="text-gradient-warm">project</span>.
                    </h2>
                    <p className="mt-5 text-white/60 text-base md:text-lg max-w-xl mx-auto">
                        Fill in the details — a specialist will get back to you
                        within 2 business hours with pricing and scheduling.
                    </p>
                </div>

                <form
                    onSubmit={onSubmit}
                    data-testid="full-quote-form"
                    className="glass rounded-3xl p-6 md:p-10 grid md:grid-cols-2 gap-4"
                >
                    <input
                        type="text"
                        placeholder="Full Name *"
                        data-testid="quote-name"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        className="bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none placeholder:text-white/40"
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number *"
                        data-testid="quote-phone"
                        value={form.phone}
                        onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                        }
                        className="bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none placeholder:text-white/40"
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        data-testid="quote-email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        className="bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none placeholder:text-white/40"
                    />
                    <select
                        data-testid="quote-service"
                        value={form.service}
                        onChange={(e) =>
                            setForm({ ...form, service: e.target.value })
                        }
                        className="bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none text-white/90"
                    >
                        <option value="" className="bg-abf-bg2">
                            Service interested…
                        </option>
                        {SERVICES.map((s) => (
                            <option
                                key={s.id}
                                value={s.title}
                                className="bg-abf-bg2"
                            >
                                {s.title}
                            </option>
                        ))}
                        <option value="Other" className="bg-abf-bg2">
                            Other
                        </option>
                    </select>
                    <select
                        data-testid="quote-city"
                        value={form.city}
                        onChange={(e) =>
                            setForm({ ...form, city: e.target.value })
                        }
                        className="md:col-span-2 bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none text-white/90"
                    >
                        <option value="" className="bg-abf-bg2">
                            Project city…
                        </option>
                        {SERVICE_AREAS.map((c) => (
                            <option key={c} value={c} className="bg-abf-bg2">
                                {c}, BC
                            </option>
                        ))}
                    </select>
                    <textarea
                        placeholder="Project details (length, height, timing…)"
                        data-testid="quote-details"
                        rows={4}
                        value={form.project_details}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                project_details: e.target.value,
                            })
                        }
                        className="md:col-span-2 bg-white/5 border border-white/10 focus:border-abf-orange focus:bg-white/10 rounded-lg px-4 py-3.5 outline-none placeholder:text-white/40"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        data-testid="quote-submit"
                        className="md:col-span-2 cta-glow bg-gradient-to-r from-[#ff7a00] to-[#f9a03f] text-white font-bold text-base py-4 rounded-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                    >
                        {sending ? "Sending your request…" : "Send My Quote Request"}
                    </button>
                    <p className="md:col-span-2 text-center text-xs text-white/50 mt-1">
                        By submitting you agree to be contacted by All Best
                        Fencing about your enquiry. We never share your
                        details.
                    </p>
                </form>
            </div>
        </section>
    );
}
