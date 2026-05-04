import { Phone, MessageCircle } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

/**
 * Floating WhatsApp + Call buttons. Fixed bottom-right, always visible.
 */
export default function FloatingActions() {
    return (
        <div
            data-testid="floating-actions"
            className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-50 flex flex-col gap-3"
        >
            {/* WhatsApp */}
            <a
                href={`https://wa.me/${BUSINESS.phoneDigits}?text=Hi%20All%20Best%20Fencing%2C%20I%27m%20interested%20in%20a%20free%20quote.`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                data-testid="fab-whatsapp"
                className="group relative w-14 h-14 rounded-full bg-[#25d366] shadow-lg shadow-[#25d366]/30 flex items-center justify-center hover:scale-110 transition-transform"
            >
                <span className="absolute inset-0 rounded-full bg-[#25d366] pulse-ring" />
                <MessageCircle className="w-6 h-6 text-white relative z-10" />
                <span className="absolute right-full mr-3 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Chat on WhatsApp
                </span>
            </a>

            {/* Call */}
            <a
                href={`tel:${BUSINESS.phoneTel}`}
                aria-label="Call us"
                data-testid="fab-call"
                className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#f9a03f] shadow-lg shadow-abf-orange/40 flex items-center justify-center hover:scale-110 transition-transform"
            >
                <span className="absolute inset-0 rounded-full bg-abf-orange pulse-ring" />
                <Phone className="w-6 h-6 text-white relative z-10" />
                <span className="absolute right-full mr-3 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Call {BUSINESS.phoneDisplay}
                </span>
            </a>
        </div>
    );
}
