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

export const transactionCategories = [
  {
    value: "food",
    label: "Food",
    keywords: ["makan", "kopi", "restoran", "warung", "snack", "jajan", "lauk"],
  },
  {
    value: "transportation",
    label: "Transportation",
    keywords: ["transport", "gojek", "grab", "bus", "kereta", "tol", "ojek", "taksi"],
  },
  {
    value: "shopping",
    label: "Shopping",
    keywords: ["belanja", "market", "mall", "shop", "pengeluaran"],
  },
  {
    value: "bills",
    label: "Bills",
    keywords: ["tagihan", "listrik", "air", "internet", "liputan", "langganan"],
  },
  {
    value: "entertainment",
    label: "Entertainment",
    keywords: ["film", "hiburan", "nonton", "games", "kafe", "hangout"],
  },
  {
    value: "health",
    label: "Health",
    keywords: ["obat", "dokter", "kesehatan", "rs", "fitness", "vitamin"],
  },
  {
    value: "education",
    label: "Education",
    keywords: ["buku", "pelajaran", "kursus", "seminar", "kuliah", "kelas"],
  },
  {
    value: "family",
    label: "Family",
    keywords: ["keluarga", "anak", "ibu", "ayah", "pacar", "istri", "suami"],
  },
  {
    value: "salary",
    label: "Salary",
    keywords: ["gaji", "salary", "income", "bayar", "penerimaan", "bonus"],
  },
  {
    value: "gift",
    label: "Gift",
    keywords: ["hadiah", "gift", "kado", "donasi", "sumbangan"],
  },
  {
    value: "other",
    label: "Other",
    keywords: [],
  },
];

export const transactionTypes = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

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
    if (category.keywords.some((keyword) => lower.includes(keyword))) {
      return category.value;
    }
    if (lower.includes(category.value)) {
      return category.value;
    }
  }
  return "other";
};
