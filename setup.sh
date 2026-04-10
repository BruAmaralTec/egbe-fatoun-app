#!/bin/bash
# ========================================
# Ẹgbẹ́ Fátọ́ún — Setup Inicial
# Execute no terminal do VS Code:
# bash setup.sh
# ========================================

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║  Ẹgbẹ́ Fátọ́ún — Setup Inicial             ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# 1. Inicializa git se ainda não existe
if [ ! -d ".git" ]; then
  echo "📦 Inicializando Git..."
  git init
  git branch -m main
fi

# 2. Instala dependências do frontend
echo ""
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# 3. Instala dependências do backend
echo ""
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# 4. Cria .env do frontend se não existe
if [ ! -f "frontend/.env.local" ]; then
  echo ""
  echo "📝 Criando frontend/.env.local a partir do exemplo..."
  cp frontend/.env.local.example frontend/.env.local
  echo "   ⚠️  Edite frontend/.env.local com suas chaves Firebase!"
fi

# 5. Cria .env do backend se não existe
if [ ! -f "backend/.env" ]; then
  echo ""
  echo "📝 Criando backend/.env a partir do exemplo..."
  cp backend/.env.example backend/.env
  echo "   ⚠️  Edite backend/.env com suas chaves Asaas!"
fi

echo ""
echo "  ✅ Setup concluído!"
echo ""
echo "  Próximos passos:"
echo "  1. Edite frontend/.env.local com suas chaves Firebase"
echo "  2. Edite backend/.env com suas chaves Asaas"
echo "  3. cd frontend && npm run dev    (porta 3000)"
echo "  4. cd backend && npm run dev     (porta 8080)"
echo ""
