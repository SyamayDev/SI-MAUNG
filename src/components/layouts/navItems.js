import { ArrowLeftRight, BarChart3, Bot, Home, PiggyBank, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/transactions", label: "Riwayat", icon: ArrowLeftRight },
  { to: "/analytics", label: "Analitik", icon: BarChart3 },
  { to: "/savings", label: "Tabungan", icon: PiggyBank },
  { to: "/ai", label: "Asisten", icon: Bot },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];
