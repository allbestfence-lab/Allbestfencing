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

    const inputBase =
        "w-full bg-slate-50 border border-slate-200 focus:border-abf-orange focus:bg-white focus:ring-2 focus:ring-abf-orange/20 transition-all rounded-lg px-4 py-3.5 outline-none placeholder:text-slate-400 text-slate-900";

    return (
        <section
            id="quote"
            data-testid="quote-section"
            className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden bg-white"
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.08),transparent_60%)]" />

            <div className="mx-auto max-w-5xl">
                <div className="text-center mb-12">
                    <div className="text-xs tracking-[0.3em] uppercase text-abf-wood font-bold mb-4">
                        Request a quote
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-slate-900">
                        Tell us about your <span className="text-gradient-warm">project</span>.
                    </h2>
                    <p className="mt-5 text-slate-600 text-base md:text-lg max-w-xl mx-auto">
                        Fill in the details — a specialist will get back to you
                        within 2 business hours with pricing and scheduling.
                    </p>
                </div>

                <form
                    onSubmit={onSubmit}
                    data-testid="full-quote-form"
                    className="bg-white rounded-3xl p-6 md:p-10 grid md:grid-cols-2 gap-4 border border-slate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]"
                >
                    <input
                        type="text"
                        placeholder="Full Name *"
                        data-testid="quote-name"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        className={inputBase}
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number *"
                        data-testid="quote-phone"
                        value={form.phone}
                        onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                        }
                        className={inputBase}
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        data-testid="quote-email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        className={inputBase}
                    />
                    <select
                        data-testid="quote-service"
                        value={form.service}
                        onChange={(e) =>
                            setForm({ ...form, service: e.target.value })
                        }
                        className={inputBase}
                    >
                        <option value="">Service interested…</option>
                        {SERVICES.map((s) => (
                            <option key={s.id} value={s.title}>
                                {s.title}
                            </option>
                        ))}
                        <option value="Other">Other</option>
                    </select>
                    <select
                        data-testid="quote-city"
                        value={form.city}
                        onChange={(e) =>
                            setForm({ ...form, city: e.target.value })
                        }
                        className={`${inputBase} md:col-span-2`}
                    >
                        <option value="">Project city…</option>
                        {SERVICE_AREAS.map((c) => (
                            <option key={c} value={c}>
                                {`${c}, BC`}
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
                        className={`${inputBase} md:col-span-2`}
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        data-testid="quote-submit"
                        className="md:col-span-2 cta-glow bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-bold text-base py-4 rounded-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                    >
                        {sending ? "Sending your request…" : "Send My Quote Request"}
                    </button>
                    <p className="md:col-span-2 text-center text-xs text-slate-500 mt-1">
                        By submitting you agree to be contacted by All Best
                        Fencing about your enquiry. We never share your
                        details.
                    </p>
                </form>
            </div>
        </section>
    );
}
