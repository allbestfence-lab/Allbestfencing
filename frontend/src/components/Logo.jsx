import { BUSINESS } from "@/lib/constants";

export default function Logo({
    size = "md",
    onClick,
    testId = "logo-lockup",
}) {
    // We adjust height classes based on the requested size.
    // The width will auto-scale to keep the aspect ratio.
    const dims =
        size === "lg"
            ? "h-20 md:h-24"
            : size === "sm"
              ? "h-10"
              : "h-14 md:h-16";

    return (
        <a
            href="#top"
            data-testid={testId}
            onClick={(e) => {
                if (onClick) return onClick(e);
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative inline-flex items-center cursor-pointer select-none"
        >
            <img
                src={BUSINESS.logo}
                alt="All Best Fencing logo"
                className={`${dims} w-auto object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply`}
            />
        </a>
    );
}
