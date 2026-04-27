// ========================================
// lib/LBiblioteca.js
// Constantes compartilhadas entre a Biblioteca pública
// (FBiblioteca) e a gestão (FBibliotecaAdmin).
// ========================================

export const FILE_TYPES = [
  { value: "pdf", label: "PDF", icon: "📄", color: "#B22222", bg: "#fde8e8" },
  { value: "word", label: "Word", icon: "📝", color: "#1a4080", bg: "#dbeafe" },
  { value: "ppt", label: "PowerPoint", icon: "📊", color: "#c2410c", bg: "#fff7ed" },
  { value: "image", label: "Imagem", icon: "🖼️", color: "#6d28d9", bg: "#f5f3ff" },
  { value: "audio", label: "Áudio", icon: "🎵", color: "#1B6B3A", bg: "#d1fae5" },
  { value: "video", label: "Vídeo", icon: "🎬", color: "#dc2626", bg: "#fef2f2" },
  { value: "link", label: "Link", icon: "🔗", color: "#0284c7", bg: "#e0f2fe" },
];

export const CATEGORIES = ["Todos", "Oríkì", "Ìtàn", "Odù", "Èwé", "Cursos", "Geral"];
