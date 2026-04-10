# Ẹgbẹ́ Fátọ́ún — Templo Religioso de Ìfá e Òrìṣà

Aplicação web completa para o Ẹgbẹ́ Fátọ́ún, sob a liderança da Ìyánífá Fátọ́ún.

## 🏗 Estrutura do Projeto

```
egbe-fatoun-app/
├── frontend/          ← Next.js 14 (Vercel)
│   ├── app/           ← Rotas (page.js = wrappers de 2 linhas)
│   ├── components/    ← Componentes reais (prefixo F)
│   └── lib/           ← Utilitários (prefixo L)
│
├── backend/           ← Node.js + Express (Cloud Run)
│   └── src/
│       ├── config/    ← BConfig.js
│       ├── middleware/ ← BAuth.js
│       ├── routes/    ← BCustomers, BPayments, BWebhooks
│       └── services/  ← BAsaasService.js
```

### Convenção de nomes
| Prefixo | Tipo | Exemplo |
|---------|------|---------|
| `F` | Frontend (tela) | `FDeployAdmin.js`, `FHomePage.js` |
| `L` | Lib (utilitário) | `LFirebase.js`, `LAuthContext.js` |
| `B` | Backend (API) | `BAsaasService.js`, `BPayments.js` |

## 🚀 Setup Rápido

### 1. Frontend
```bash
cd frontend
cp .env.local.example .env.local   # Preencher com suas chaves Firebase
npm install
npm run dev                         # http://localhost:3000
```

### 2. Backend
```bash
cd backend
cp .env.example .env               # Preencher com chaves Asaas
npm install
npm run dev                         # http://localhost:8080
```

## ☁️ Deploy

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

### Backend → Cloud Run
```bash
cd backend
gcloud run deploy egbe-payments \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated
```

## 🔗 Integrações
- **Asaas** — Pagamentos (Pix, Boleto, Cartão)
- **Firebase** — Auth, Firestore, Storage
- **Nuvemshop** — E-commerce
- **Sympla** — Inscrições em eventos
- **StreamYard** — Transmissão de cursos
- **YouTube** — Gravações de cursos
- **Google Translate** — Dicionário PT↔ES↔Yorùbá↔EN
- **SerpAPI** — Busca avançada

Todas as integrações são gerenciadas pela tela do Técnico em `/dashboard/admin/integracoes`.

## 👥 Perfis de Acesso
| Perfil | Nível | Acesso |
|--------|-------|--------|
| Sacerdotisa | Super Admin | Tudo |
| Técnico | Super Admin | Tudo |
| Conselho | Admin | Membros + Relatórios |
| Filho(a) da Casa | Configurável | Eventos, Cursos, Biblioteca |
| Cliente | Configurável | Eventos, Cursos |

---

**Ìyánífá Fátọ́ún** — Ẹgbẹ́ Fátọ́ún, Templo Religioso de Ìfá e Òrìṣà
