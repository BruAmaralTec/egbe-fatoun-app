// ========================================
// lib/LPermissions.js
// Catálogo de todas as áreas do sistema
// e defaults de permissão por perfil
// ========================================

// Áreas fixas que todos veem (não configuráveis)
export const FIXED_AREAS = [
  { key: "inicio", label: "Início", href: "/dashboard", icon: "🏠" },
  { key: "perfil", label: "Meu Perfil", href: "/dashboard/perfil", icon: "👤" },
];

// Todas as áreas configuráveis do sistema
export const ALL_AREAS = [
  // Comunidade
  { key: "ose", label: "Calendário de Ọ̀sẹ̀", href: "/dashboard/ose", icon: "📿", group: "Comunidade" },
  { key: "eventos", label: "Eventos", href: "/dashboard/eventos", icon: "🎉", group: "Comunidade" },
  { key: "cursos", label: "Cursos", href: "/dashboard/cursos", icon: "📚", group: "Comunidade" },
  { key: "biblioteca", label: "Biblioteca", href: "/dashboard/biblioteca", icon: "📖", group: "Comunidade" },
  { key: "dicionario", label: "Dicionário", href: "/dashboard/dicionario", icon: "🌐", group: "Comunidade" },
  { key: "pagamentos", label: "Pagamentos", href: "/dashboard/pagamentos", icon: "💳", group: "Comunidade" },
  { key: "notificacoes", label: "Notificações", href: "/dashboard/notificacoes", icon: "🔔", group: "Comunidade" },

  // Gestão
  { key: "membros", label: "Gestão de Usuários", href: "/dashboard/membros", icon: "👥", group: "Gestão" },
  { key: "admin-eventos", label: "Gerenciar Eventos", href: "/dashboard/admin/eventos", icon: "📅", group: "Gestão" },
  { key: "admin-cursos", label: "Gerenciar Cursos", href: "/dashboard/admin/cursos", icon: "🎓", group: "Gestão" },
  { key: "admin-certificados", label: "Certificados", href: "/dashboard/admin/certificados", icon: "📜", group: "Gestão" },
  { key: "admin-rituais", label: "Gestão de Rituais", href: "/dashboard/admin/rituais", icon: "🕯️", group: "Gestão" },
  { key: "admin-ose", label: "Gestão do Calendário Ọ̀sẹ̀", href: "/dashboard/admin/ose", icon: "📿", group: "Gestão" },
  { key: "admin-notificacoes", label: "Gestão de Notificações", href: "/dashboard/admin/notificacoes", icon: "🔔", group: "Gestão" },
  { key: "admin-financeiro", label: "Financeiro", href: "/dashboard/admin/financeiro", icon: "💰", group: "Gestão" },

  // Sistema (só técnico por padrão)
  { key: "admin-integracoes", label: "Integrações", href: "/dashboard/admin/integracoes", icon: "🔗", group: "Sistema" },
  { key: "admin-configuracoes", label: "Configurações", href: "/dashboard/admin/configuracoes", icon: "⚙️", group: "Sistema" },
  { key: "admin-deploy", label: "Deploy & Config", href: "/dashboard/admin/deploy", icon: "🚀", group: "Sistema" },
  { key: "admin-permissoes", label: "Permissões", href: "/dashboard/admin/permissoes", icon: "🔐", group: "Sistema" },
];

// Defaults usados na primeira carga (antes de configurar no Firestore)
export const DEFAULT_PERMISSIONS = {
  cliente: ["eventos", "cursos", "ose"],
  midias: ["eventos", "cursos", "ose", "admin-eventos", "admin-cursos"],
  filho: ["eventos", "cursos", "ose", "biblioteca", "dicionario", "pagamentos", "notificacoes"],
  conselho: ["eventos", "cursos", "ose", "biblioteca", "dicionario", "pagamentos", "notificacoes", "membros", "admin-eventos", "admin-cursos", "admin-certificados", "admin-rituais", "admin-ose", "admin-notificacoes"],
  sacerdote: ["eventos", "cursos", "ose", "biblioteca", "dicionario", "pagamentos", "notificacoes", "membros", "admin-eventos", "admin-cursos", "admin-certificados", "admin-rituais", "admin-ose", "admin-notificacoes", "admin-financeiro"],
  tecnico: ALL_AREAS.map((a) => a.key),
};

export const ROLES = [
  { value: "sacerdote", label: "Sacerdotisa", color: "#f59e0b" },
  { value: "tecnico", label: "Técnico", color: "#3b82f6" },
  { value: "conselho", label: "Conselho", color: "#6366f1" },
  { value: "midias", label: "Mídias", color: "#ec4899" },
  { value: "filho", label: "Filho(a) da Casa", color: "#22c55e" },
  { value: "cliente", label: "Cliente", color: "#9ca3af" },
];
