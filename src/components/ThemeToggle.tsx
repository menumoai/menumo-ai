// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // On mount, read system preference or stored preference
    useEffect(() => {
        const root = document.documentElement;

        // prefer stored value if present
        const stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light") {
            const dark = stored === "dark";
            setIsDark(dark);
            root.classList.toggle("dark", dark);
            return;
        }

        // otherwise use system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(prefersDark);
        root.classList.toggle("dark", prefersDark);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    return (
        <button
            type="button"
            onClick={() => setIsDark((v) => !v)}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
        >
            {isDark ? "🌙 Dark" : "☀️ Light"}
        </button>
    );
}
