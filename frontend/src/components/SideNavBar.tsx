"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  icon: string;
  title: string;
  activePaths?: string[];
  visible?: (user: ReturnType<typeof useAuth>["user"]) => boolean;
};

const MAIN_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", title: "Dashboard" },
  { href: "/", icon: "chat_bubble", title: "Messages" },
  { href: "/projects", icon: "view_kanban", title: "Projects" },
  { href: "/proposals", icon: "request_quote", title: "Proposals" },
  { href: "/catalog", icon: "inventory_2", title: "Catalog" },
  { href: "/tasks", icon: "task", title: "Tasks" },
];

const ADMIN_DOMAIN_ITEMS: NavItem[] = [
  {
    href: "/users",
    icon: "group",
    title: "Users",
    activePaths: ["/users", "/admin/users", "/admin/user-types", "/admin/audit"],
    visible: (user) => !!(user?.user_type?.can_manage_users || user?.user_type?.can_create_user_types || user?.user_type?.can_view_audit_logs),
  },
  {
    href: "/config",
    icon: "settings",
    title: "Config",
    activePaths: ["/config", "/admin/settings"],
    visible: (user) => !!user?.user_type?.can_change_settings,
  },
];

function isItemActive(pathname: string, item: NavItem) {
  const paths = item.activePaths ?? [item.href];
  return paths.some((path) => (path === "/" ? pathname === "/" : pathname.startsWith(path)));
}

export default function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const visibleAdminItems = ADMIN_DOMAIN_ITEMS.filter((item) => item.visible?.(user) ?? true);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const renderItem = ({ href, icon, title, activePaths }: NavItem) => {
    const active = isItemActive(pathname, { href, icon, title, activePaths });

    return (
      <Link
        key={href}
        href={href}
        title={title}
        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
          active
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
        )}
        <span
          className="material-symbols-outlined text-[22px]"
          style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {icon}
        </span>
      </Link>
    );
  };

  return (
    <nav className="h-full w-[64px] shrink-0 bg-white border-r border-[#E9ECEF] hidden md:flex flex-col items-center py-4">
      <Link href="/" className="mb-5 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-white text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          support_agent
        </span>
      </Link>

      <div className="flex-1 flex flex-col items-center gap-1 w-full">
        {MAIN_ITEMS.map(renderItem)}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="w-8 my-1 border-t border-[#E9ECEF]" />
            {visibleAdminItems.map(renderItem)}
          </>
        )}
      </div>

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
