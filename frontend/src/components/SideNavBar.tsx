"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, clearAuth } from "@/lib/api";

interface StoredUser {
  full_name: string;
  avatar?: string;
  user_type?: { can_manage_users: boolean };
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard",             title: "Dashboard"  },
  { href: "/",          icon: "chat_bubble",            title: "Inbox"      },
];

const ADMIN_ITEMS = [
  { href: "/admin/users",       icon: "group",    title: "Users"      },
  { href: "/admin/user-types",  icon: "badge",    title: "User Types" },
  { href: "/admin/settings",    icon: "settings", title: "Settings"   },
];

export default function SideNavBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser<StoredUser>());
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const canManageUsers = user?.user_type?.can_manage_users ?? false;

  return (
    <nav className="h-full w-[64px] shrink-0 bg-white border-r border-[#E9ECEF] flex flex-col items-center py-4">
      {/* Logo */}
      <Link href="/" className="mb-5 w-10 h-10 bg-[#7C4DFF] rounded-xl flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-white text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          support_agent
        </span>
      </Link>

      {/* Main nav */}
      <div className="flex-1 flex flex-col items-center gap-1 w-full">
        {NAV_ITEMS.map(({ href, icon, title }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={title}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                active
                  ? "bg-purple-50 text-[#7C4DFF]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#7C4DFF] rounded-r-full" />
              )}
              <span
                className="material-symbols-outlined text-[22px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
            </Link>
          );
        })}

        {/* Admin section */}
        {canManageUsers && (
          <>
            <div className="w-8 my-1 border-t border-[#E9ECEF]" />
            {ADMIN_ITEMS.map(({ href, icon, title }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={title}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                    active
                      ? "bg-purple-50 text-[#7C4DFF]"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#7C4DFF] rounded-r-full" />
                  )}
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="flex items-center justify-center w-12 h-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[22px]">logout</span>
      </button>
    </nav>
  );
}
