"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SideNavBar from "./SideNavBar";
import { getToken } from "@/lib/api";
import { AuthProvider } from "@/contexts/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth");
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPublic(pathname)) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (isPublic(pathname)) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-[#F8F9FA] font-['Inter'] text-slate-900 antialiased">
        <SideNavBar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
