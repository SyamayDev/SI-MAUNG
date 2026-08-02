import {
  Bus,
  Coffee,
  Train,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  BookOpen,
  Users,
  Briefcase,
  Gift,
  MoreHorizontal,
} from "lucide-react";
import { transactionCategories } from "../lib/constants";

export const getCategoryIcon = (category) => {
  const normalizedCategory = category?.toLowerCase() || "other";
  const categoryIconMap = {
    food: <Coffee size={20} />,
    transportation: <Bus size={20} />,
    shopping: <ShoppingBag size={20} />,
    bills: <Receipt size={20} />,
    entertainment: <Clapperboard size={20} />,
    health: <HeartPulse size={20} />,
    education: <BookOpen size={20} />,
    family: <Users size={20} />,
    salary: <Briefcase size={20} />,
    gift: <Gift size={20} />,
    other: <MoreHorizontal size={20} />,
  };
  return categoryIconMap[normalizedCategory] || <MoreHorizontal size={20} />;
};

export const guessCategoryFromText = (text) => {
  const lower = text?.toLowerCase() || "";
  for (const category of transactionCategories) {
    if (lower.includes(category.label.toLowerCase())) {
      return category.value;
    }
    if (lower.includes(category.value)) {
      return category.value;
    }
  }
  return "other";
};
