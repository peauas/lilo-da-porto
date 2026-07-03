# Lilo da Porto

Sistema profissional de gestão de folhas mensais para funcionários de assistência veicular — integrado ao portal Porto Seguro via extensão Chrome/Edge.

## Stack

- **Frontend:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma, PostgreSQL (Neon)
- **Auth:** Auth.js v5 (Credentials + JWT)
- **Storage:** Vercel Blob
- **Extensão:** Chrome Manifest V3

## Pré-requisitos

- Node.js 20+
- Conta [Neon](https://neon.tech) (PostgreSQL)
- Conta [Vercel](https://vercel.com) (deploy)
- Vercel Blob token (upload de documentos)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/peauas/lilo-da-porto.git
cd lilo-da-porto

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Gere o client Prisma
npm run db:generate

# Execute migrations
npm run db:migrate

# Seed (admin + funcionário exemplo)
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

**Login padrão (seed):**
- E-mail: `admin@lilodaporto.com`
- Senha: `admin123`

## Variáveis de ambiente

Veja [.env.example](.env.example) para a lista completa.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string Neon (pooler) |
| `DIRECT_URL` | Connection string direta (migrations) |
| `AUTH_SECRET` | Secret para Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | URL da aplicação |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob |

## Extensão Chrome

```bash
npm run extension:build
```

1. Abra `chrome://extensions`
2. Ative "Modo do desenvolvedor"
3. "Carregar sem compactação" → selecione `extension/dist`
4. A URL da API já vem como `https://lilo-da-porto.vercel.app` (use `http://localhost:3000` só em desenvolvimento)
5. Faça login e abra um serviço no portal Porto Seguro
6. Clique na extensão → Capturar → Revise → Enviar

## Deploy (Vercel)

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente
3. Adicione integração Neon
4. Deploy automático a cada push

## Estrutura

```
app/           → Rotas Next.js (auth + dashboard + API)
components/    → UI, forms, layout, dialogs, charts
services/      → Lógica de negócio server-side
schemas/       → Validação Zod
prisma/        → Schema e migrations
extension/     → Extensão Chrome MV3
docs/          → Documentação técnica
```

## Funcionalidades

- Login / logout / esqueci senha / alterar senha
- Dashboard com métricas e gráficos
- CRUD de funcionários com documentos
- CRUD de serviços com prevenção de QRU duplicado
- Folhas mensais com cálculo automático
- Exportação PDF e Excel
- Extensão Chrome com extração resiliente

## Licença

Projeto privado — uso interno.
