# Ẹgbẹ́ Fátọ́ún — API de Pagamentos

Microsserviço de pagamentos integrado com **Asaas** para deploy no **Google Cloud Run**.

## Estrutura

```
api-payments/
├── src/
│   ├── config/index.js         # Variáveis de ambiente
│   ├── services/asaasService.js # Cliente HTTP Asaas
│   ├── routes/
│   │   ├── customers.js         # Criar/buscar clientes
│   │   ├── payments.js          # Criar cobranças (Pix, Boleto, Cartão)
│   │   └── webhooks.js          # Receber confirmações do Asaas
│   ├── middleware/auth.js       # Verificação Firebase Auth
│   └── app.js                   # Express server
├── Dockerfile
├── package.json
└── .env.example
```

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | Não | Health check |
| POST | `/api/customers` | Firebase | Criar cliente no Asaas |
| GET | `/api/customers/me` | Firebase | Meus dados + cobranças |
| POST | `/api/payments` | Firebase | Criar cobrança |
| GET | `/api/payments/:id` | Firebase | Consultar cobrança |
| GET | `/api/payments/:id/pix` | Firebase | QR Code Pix |
| POST | `/api/payments/link` | Admin | Criar link de pagamento |
| POST | `/api/webhooks/asaas` | Token | Webhook do Asaas |

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# 3. Criar conta sandbox no Asaas
# https://sandbox.asaas.com → Integrações → Gerar Chave de API

# 4. Rodar em desenvolvimento
npm run dev
```

## Deploy no Cloud Run

```bash
# 1. Autenticar no Google Cloud
gcloud auth login
gcloud config set project SEU_PROJETO_ID

# 2. Build e deploy em um comando
gcloud run deploy egbe-payments \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars "ASAAS_ENV=sandbox,ASAAS_API_KEY=sua_chave,ASAAS_WEBHOOK_TOKEN=seu_token,FIREBASE_PROJECT_ID=seu_projeto"

# 3. Após o deploy, copie a URL gerada e configure no Asaas:
# Painel Asaas → Integrações → Webhooks → Nova configuração
# URL: https://egbe-payments-xxxxx.a.run.app/api/webhooks/asaas
```

## Fluxo de Pagamento

1. Frontend chama `POST /api/customers` para cadastrar o cliente
2. Frontend chama `POST /api/payments` com valor e tipo (Pix/Boleto/Cartão)
3. API retorna link de pagamento ou QR Code Pix
4. Usuário paga pelo meio escolhido
5. Asaas envia webhook para `POST /api/webhooks/asaas`
6. Webhook atualiza Firestore → frontend recebe update em tempo real
