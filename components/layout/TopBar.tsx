"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { logout } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/ventas", label: "Punto de Venta", icon: "point_of_sale" },
  { href: "/inventario", label: "Inventario", icon: "inventory_2" },
  { href: "/clientes", label: "Clientes", icon: "people" },
  { href: "/analiticas", label: "Analíticas", icon: "analytics", adminOnly: true },
  { href: "/usuarios", label: "Usuarios", icon: "manage_accounts", adminOnly: true },
];

interface TopBarProps {
  userName: string;
  userRole: UserRole;
}

export function TopBar({ userName, userRole }: TopBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <>
      {/* Desktop top bar */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-surface shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted/10"
          aria-label="Menú"
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>

        {/* Page title — could be dynamic */}
        <div className="hidden md:block" />

        {/* User menu */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted hidden sm:inline">
            {userName}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="p-2 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
              title="Cerrar sesión"
            >
              <Icon name="logout" size={20} />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Slide-in menu */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="storefront" className="text-primary" size={20} />
                </div>
                <p className="font-heading font-bold text-foreground text-sm">
                  Tobón
                </p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted/10"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : item.href === "/ventas"
                      ? pathname.startsWith("/ventas") ||
                        pathname.startsWith("/pos")
                      : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted hover:bg-muted/10 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon name={item.icon} size={20} fill={isActive} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User + Logout */}
            <div className="px-3 py-4 border-t border-border">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {userName}
                    </p>
                    <p className="text-[11px] text-muted capitalize">
                      {userRole === "admin" ? "Admin" : "Vendedor"}
                    </p>
                  </div>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                    title="Cerrar sesión"
                  >
                    <Icon name="logout" size={18} />
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
