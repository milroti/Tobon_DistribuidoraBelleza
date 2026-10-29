"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
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
];

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon name="storefront" className="text-primary" size={20} />
        </div>
        <div>
          <p className="font-heading font-bold text-foreground text-sm leading-tight">
            Tobón
          </p>
          <p className="text-[11px] text-muted leading-tight">
            Distribuidora de Belleza
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/ventas"
                ? pathname.startsWith("/ventas") || pathname.startsWith("/pos")
                : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <Icon
                name={item.icon}
                size={20}
                fill={isActive}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-secondary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userName}
            </p>
            <p className="text-[11px] text-muted capitalize">
              {userRole === "admin" ? "Administrador" : "Vendedor"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
