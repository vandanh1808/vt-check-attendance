"use client";

import { useState, useCallback, type ReactNode } from "react";
import { ParticlesProvider, type ParticlesPluginRegistrar } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import Sidebar, { MenuIcon } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import { ThemeCtx, useThemeProvider } from "@/hooks/useTheme";
import type { UserRole } from "@/types";

interface ProtectedShellProps {
  userName: string;
  userRole: UserRole;
  children: ReactNode;
}

export default function ProtectedShell({
  userName,
  userRole,
  children,
}: ProtectedShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeCtx = useThemeProvider();
  const particlesInit: ParticlesPluginRegistrar = useCallback(async (engine) => {
    await loadSlim(engine);
    await loadEmittersPlugin(engine);
  }, []);

  const isDark = themeCtx.theme === "dark";

  return (
    <ThemeCtx.Provider value={themeCtx}>
      <ParticlesProvider init={particlesInit}>
      {/* Gradient background behind everything */}
      <div
        className="fixed inset-0 -z-10 transition-all duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 20% 20%, #1e1b4b 0%, #0c0a1d 40%, #070b14 100%)"
            : "#f8fafc",
        }}
      />
      <div className="flex h-screen overflow-hidden">
        <AnimatedBackground />
        <Sidebar
          userRole={userRole}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar
            userName={userName}
            userRole={userRole}
            mobileMenuButton={
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 lg:hidden"
                aria-label="Mở menu"
              >
                {MenuIcon}
              </button>
            }
          />
          <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
      </ParticlesProvider>
    </ThemeCtx.Provider>
  );
}
