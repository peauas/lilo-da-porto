# Deploy — Lilo da Porto

## Vercel + Neon (recomendado)

### 1. GitHub

```bash
gh auth login
git add .
git commit -m "feat: initial release — Lilo da Porto"
gh repo create lilo-da-porto --public --source=. --remote=origin --push
```

### 2. Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe `peauas/lilo-da-porto`
3. Adicione as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL pooler do Neon |
| `DIRECT_URL` | URL direta do Neon (sem `-pooler`) |
| `AUTH_SECRET` | Mesmo valor do `.env` local |
| `AUTH_URL` | `https://seu-dominio.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob (Storage) |
| `ADMIN_EMAIL` | E-mail do admin |
| `ADMIN_PASSWORD` | Senha inicial (só para seed) |

4. Deploy

### 3. Seed em produção

Após o primeiro deploy, rode localmente apontando para produção ou use Vercel CLI:

```bash
npx vercel env pull .env.production
npm run db:seed
```

### 4. Vercel Blob

1. No dashboard Vercel → Storage → Create Blob Store
2. Conecte ao projeto
3. Copie `BLOB_READ_WRITE_TOKEN` para as env vars

### 5. Extensão Chrome

Após deploy, configure no popup da extensão:
- **URL da API:** `https://seu-dominio.vercel.app`
- Faça login com as credenciais do admin
