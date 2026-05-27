"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="group relative flex h-8 w-16 items-center rounded-full p-1 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
          : "linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)",
        boxShadow: isDark
          ? "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(99,102,241,0.15)"
          : "inset 0 1px 3px rgba(0,0,0,0.1), 0 0 8px rgba(56,189,248,0.2)",
      }}
    >
      {/* Stars in dark track */}
      <span className={`absolute left-2 top-1.5 h-0.5 w-0.5 rounded-full bg-white transition-opacity duration-500 ${isDark ? "opacity-60" : "opacity-0"}`} />
      <span className={`absolute left-3.5 top-3.5 h-1 w-1 rounded-full bg-white transition-opacity duration-500 ${isDark ? "opacity-40" : "opacity-0"}`} />
      <span className={`absolute left-1.5 top-4 h-0.5 w-0.5 rounded-full bg-indigo-300 transition-opacity duration-500 ${isDark ? "opacity-50" : "opacity-0"}`} />

      {/* Clouds in light track */}
      <span className={`absolute right-2 top-1 h-2 w-3 rounded-full bg-white transition-opacity duration-500 ${isDark ? "opacity-0" : "opacity-50"}`} />
      <span className={`absolute right-1 top-3.5 h-1.5 w-2.5 rounded-full bg-white transition-opacity duration-500 ${isDark ? "opacity-0" : "opacity-30"}`} />

      {/* Knob */}
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full shadow-lg transition-all duration-500"
        style={{
          transform: isDark ? "translateX(32px)" : "translateX(0)",
          background: isDark
            ? "linear-gradient(135deg, #334155 0%, #475569 100%)"
            : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          boxShadow: isDark
            ? "0 0 12px rgba(165,180,252,0.3), 0 2px 4px rgba(0,0,0,0.3)"
            : "0 0 12px rgba(251,191,36,0.4), 0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {isDark ? (
          <svg className="h-3.5 w-3.5 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}
