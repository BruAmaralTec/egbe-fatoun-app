// ========================================
// lib/LOse.js
// Dados mestres do calendário de Ọ̀sẹ̀:
// - Lista completa de Òrìṣà com cores
// - Ciclos padrão (JÀKÚTÁ, ÒÒSÀ, ÀWÒ, ÒGÚN)
// ========================================

export const ALL_ORIXAS = [
  // JÀKÚTÁ
  { name: "Ọyá", color: "#8b1e1e", bg: "#fde8e8" },
  { name: "Ṣàngó", color: "#B22222", bg: "#fde8e8" },
  // ÒÒSÀ
  { name: "Ọbàtálá", color: "#1a4080", bg: "#dbeafe" },
  { name: "Ajé", color: "#D4A017", bg: "#fef3cd" },
  { name: "Sakpatá", color: "#6d28d9", bg: "#ede9fe" },
  { name: "Ègúngun", color: "#4b5563", bg: "#f3f4f6" },
  // ÀWÒ
  { name: "Ọ̀rúnmìlà", color: "#0e4423", bg: "#d1fae5" },
  { name: "Èṣù", color: "#1a1a1a", bg: "#e5e7eb" },
  { name: "Ìyá Mi Òṣòròngá", color: "#7c2d12", bg: "#fef3c7" },
  { name: "Ọ́ṣun", color: "#D4A017", bg: "#fef3cd" },
  // ÒGÚN
  { name: "Ògún", color: "#1B6B3A", bg: "#d1fae5" },
  { name: "Òṣóòsì", color: "#065f46", bg: "#d1fae5" },
  { name: "Òrìṣà Ọkọ̀", color: "#78350f", bg: "#fef3c7" },
  { name: "Erínlẹ̀", color: "#0891b2", bg: "#cffafe" },
  { name: "Otín", color: "#b45309", bg: "#fef3c7" },
  { name: "Ológúnèdè", color: "#a16207", bg: "#fef3c7" },
  // Adicionais
  { name: "Yemọjá", color: "#0369a1", bg: "#dbeafe" },
];

export const ORIXA_COLOR = Object.fromEntries(ALL_ORIXAS.map((o) => [o.name, o.color]));
export const ORIXA_BG = Object.fromEntries(ALL_ORIXAS.map((o) => [o.name, o.bg]));

// Ciclos padrão — 4 dias, começando em 2026-01-01
export const DEFAULT_CYCLES = {
  jakuta: {
    id: "jakuta",
    name: "Ọ̀sẹ̀ Jàkútá",
    orixas: ["Ọyá", "Ṣàngó"],
    startDate: "2026-01-01",
    cycleDays: 4,
    color: "#B22222",
  },
  oosa: {
    id: "oosa",
    name: "Ọ̀sẹ̀ Òòsà",
    orixas: ["Ọbàtálá", "Ajé", "Sakpatá", "Ègúngun"],
    startDate: "2026-01-02",
    cycleDays: 4,
    color: "#1a4080",
  },
  awo: {
    id: "awo",
    name: "Ọ̀sẹ̀ Àwò",
    orixas: ["Ọ̀rúnmìlà", "Èṣù", "Ìyá Mi Òṣòròngá", "Ọ́ṣun"],
    startDate: "2026-01-03",
    cycleDays: 4,
    color: "#7c2d12",
  },
  ogun: {
    id: "ogun",
    name: "Ọ̀sẹ̀ Ògún",
    orixas: ["Ògún", "Òṣóòsì", "Òrìṣà Ọkọ̀", "Erínlẹ̀", "Otín", "Ológúnèdè"],
    startDate: "2026-01-04",
    cycleDays: 4,
    color: "#1B6B3A",
  },
};
