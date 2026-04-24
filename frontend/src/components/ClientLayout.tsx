"use client";

import { usePathname } from "next/navigation";
import SideNavBar from "./SideNavBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] font-['Inter'] text-slate-900 antialiased">
      <SideNavBar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
