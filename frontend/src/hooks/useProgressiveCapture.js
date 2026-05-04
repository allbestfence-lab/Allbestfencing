import { useEffect, useRef } from "react";
import { submitPartialLead } from "@/lib/api";

/**
 * Hook: debounce-fire a "partial lead" call once the user types a valid email
 * or phone. Dedupes client-side per unique email/phone combo so we don't spam
 * the backend on every keystroke.
 */
export default function useProgressiveCapture({ name, email, phone }) {
    const timerRef = useRef(null);
    const sentRef = useRef(new Set());

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const trimmedEmail = (email || "").trim().toLowerCase();
        const digits = (phone || "").replace(/\D/g, "");
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
        const isValidPhone = digits.length >= 10;

        if (!isValidEmail && !isValidPhone) return;

        const key = `${isValidEmail ? trimmedEmail : ""}|${isValidPhone ? digits : ""}`;
        if (sentRef.current.has(key)) return;

        timerRef.current = setTimeout(async () => {
            try {
                await submitPartialLead({
                    name: name || null,
                    email: isValidEmail ? trimmedEmail : null,
                    phone: isValidPhone ? phone : null,
                });
                sentRef.current.add(key);
            } catch (err) {
                // silent — partial capture is non-blocking UX
                console.warn("partial capture failed", err);
            }
        }, 900);

        return () => timerRef.current && clearTimeout(timerRef.current);
    }, [name, email, phone]);
}
