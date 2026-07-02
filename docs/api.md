# API — Lilo da Porto

Todas as respostas seguem o formato:

```json
{ "success": true, "data": {}, "meta": {} }
{ "success": false, "error": { "code": "", "message": "", "details": {} } }
```

## Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/extension-token` | Login extensão (retorna JWT) |
| GET | `/api/auth/extension-token` | Token da sessão web |
| POST | `/api/auth/password` | forgot / reset / change |

## Employees

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/employees` | Listar (search, status, page) |
| POST | `/api/employees` | Criar |
| GET | `/api/employees/:id` | Detalhe |
| PATCH | `/api/employees/:id` | Atualizar |
| DELETE | `/api/employees/:id` | Excluir |
| GET/POST/DELETE | `/api/employees/:id/documents` | Documentos |

## Services

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/services?grouped=true` | Agrupado por ano/mês |
| GET | `/api/services` | Listar |
| POST | `/api/services` | Criar (409 se QRU duplicado) |
| PATCH | `/api/services/:id` | Atualizar |
| DELETE | `/api/services/:id` | Excluir |
| POST | `/api/services/check-qru` | Verificar duplicidade |

## Sheets

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/sheets` | Listar folhas |
| GET | `/api/sheets?employeeId&year&month` | Obter/criar folha |
| PATCH | `/api/sheets/:id` | Atualizar |
| POST | `/api/sheets/:id` | `{ action: "close" \| "reopen" }` |
| GET | `/api/sheets/:id/export?format=pdf\|excel` | Exportar |

## Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/stats` | Métricas do mês |
| GET | `/api/dashboard/stats?year&month` | Stats do período |
