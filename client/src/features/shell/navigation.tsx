import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Users,
  Wallet,
  type LucideIcon
} from "lucide-react";
import type { UserRole } from "@/store/auth.store";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  roles?: UserRole[];
  disabled?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Konfigurasi navigasi terpusat (satu sumber menu app shell).
 * Modul masa depan cukup menambah entri di sini tanpa mengedit komponen shell.
 * `roles` kosong = boleh dilihat semua role.
 * `disabled` = item belum aktif (modul belum diimplementasi).
 */
export const navSections: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/"
      }
    ]
  },
  {
    title: "Manajemen",
    items: [
      {
        label: "Department",
        icon: Building2,
        to: "/departments",
        roles: ["HRD"]
      },
      {
        label: "Karyawan",
        icon: Users,
        to: "/employees"
      }
    ]
  },
  {
    title: "Kehadiran",
    items: [
      {
        label: "Cuti",
        icon: CalendarDays,
        to: "/leaves",
        disabled: true
      },
      {
        label: "Absensi",
        icon: MapPin,
        to: "/attendance",
        disabled: true
      }
    ]
  },
  {
    title: "Keuangan",
    items: [
      {
        label: "Penggajian",
        icon: Wallet,
        to: "/payroll",
        disabled: true
      }
    ]
  }
];

/** Filter menu sesuai role user saat ini (roles kosong = semua role). */
export function filterNavForRole(
  sections: NavSection[],
  role?: UserRole
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (role && item.roles.includes(role))
      )
    }))
    .filter((section) => section.items.length > 0);
}

export type { LucideIcon };
