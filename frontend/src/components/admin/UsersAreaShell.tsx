"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const USERS_NAV_ITEMS = [
  {
    href: "/admin/users",
    label: "User Management",
    description: "Manage accounts and approvals",
    icon: "group",
  },
  {
    href: "/admin/user-types",
    label: "User Types",
    description: "Control roles and permissions",
    icon: "badge",
  },
  {
    href: "/admin/audit",
    label: "Audit Logs",
    description: "Review sensitive admin actions",
    icon: "policy",
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function UsersAreaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-[#E9ECEF] bg-white">
        <div className="border-b border-[#E9ECEF] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Users</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Administration</h2>
          <p className="mt-1 text-sm text-slate-500">Manage people, access, and audit visibility in one place.</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {USERS_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl border px-4 py-3 transition-colors ${
                  active
                    ? "border-indigo-100 bg-indigo-50"
                    : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-800"}`}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[#E9ECEF] bg-white px-4 py-3 md:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Users</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {USERS_NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
