import { BUSINESS } from "@/lib/constants";

/**
 * Interactive logo lockup.
 * - Dark badge frame makes the silver/gold logo pop on light backgrounds
 * - Hover: scale + slight rotate, orange glow ring, shimmer sweep,
 *   wordmark colour-shifts to warm gradient, tagline letter-spacing widens.
 * - Constant gentle float animation for "alive" feel.
 */
export default function Logo({
    variant = "light", // "light" | "dark"
    size = "md", // "sm" | "md" | "lg"
    onClick,
    withText = true,
    testId = "logo-lockup",
}) {
    const dims =
        size === "lg"
            ? "h-16 w-16 md:h-[72px] md:w-[72px]"
            : size === "sm"
              ? "h-11 w-11"
              : "h-12 w-12 md:h-14 md:w-14";

    const titleSize =
        size === "lg"
            ? "text-xl md:text-2xl"
            : size === "sm"
              ? "text-base"
              : "text-lg md:text-xl";

    const wordmarkBase =
        variant === "dark"
            ? "from-white to-slate-300"
            : "from-slate-900 to-slate-700";

    return (
        <a
            href="#top"
            data-testid={testId}
            onClick={(e) => {
                if (onClick) return onClick(e);
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative inline-flex items-center gap-3.5 cursor-pointer select-none"
        >
            {/* Badge wrapper with float animation */}
            <span className="relative inline-flex logo-float">
                {/* Animated glow aura */}
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff7a00] via-[#d97706] to-[#8b5a2b] opacity-0 blur-xl group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

                {/* Rotating conic ring (only on hover) */}
                <span className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 logo-conic pointer-events-none" />

                {/* Inner dark badge */}
                <span
                    className={`relative ${dims} rounded-2xl bg-gradient-to-br from-[#0a1128] to-[#1c2a44] ring-2 ring-slate-900/80 group-hover:ring-[#ff7a00] shadow-lg shadow-slate-900/20 transition-all duration-500 overflow-hidden flex items-center justify-center group-hover:scale-[1.08] group-hover:rotate-[-4deg]`}
                >
                    {/* Shimmer sweep on hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.28)_50%,transparent_70%)] pointer-events-none" />

                    <img
                        src={BUSINESS.logo}
                        alt="All Best Fencing logo"
                        className="relative z-10 h-full w-full object-contain p-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                    />
                </span>

                {/* Corner accent dot */}
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ff7a00] opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 pointer-events-none">
                    <span className="absolute inset-0 rounded-full bg-[#ff7a00] animate-ping opacity-75" />
                </span>
            </span>

            {withText && (
                <span className="leading-tight hidden sm:block">
                    <span
                        className={`block font-display ${titleSize} font-bold tracking-tight bg-gradient-to-r ${wordmarkBase} bg-clip-text text-transparent group-hover:from-[#ff7a00] group-hover:to-[#d97706] transition-all duration-500`}
                    >
                        All Best Fencing
                    </span>
                    <span
                        className={`block text-[10px] md:text-[11px] tracking-[0.28em] uppercase font-bold ${
                            variant === "dark"
                                ? "text-[#ff7a00]"
                                : "text-[#ff7a00]"
                        } group-hover:tracking-[0.35em] transition-all duration-500`}
                    >
                        Built Strong · Secured Right
                    </span>
                </span>
            )}
        </a>
    );
}
