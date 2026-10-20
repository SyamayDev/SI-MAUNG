import {
  Briefcase,
  BookOpen,
  Bus,
  Clapperboard,
  Gift,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { getCategory } from "../../lib/finance/categories";

const ICONS = {
  food: UtensilsCrossed,
  transportation: Bus,
  shopping: ShoppingBag,
  bills: Receipt,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: BookOpen,
  family: Users,
  salary: Briefcase,
  gift: Gift,
  other: MoreHorizontal,
};

/** Category tile; decorative — the category label is always rendered as text nearby. */
export default function CategoryIcon({ category, size = 20 }) {
  const cat = getCategory(category);
  const Icon = ICONS[cat.value] || MoreHorizontal;
  return (
    <span className="cat-icon" style={{ "--cat": cat.color }} aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}
