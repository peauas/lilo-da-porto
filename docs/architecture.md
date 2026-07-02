# Arquitetura — Lilo da Porto

## Visão geral

Monolith modular Next.js com API REST, Server Actions e extensão Chrome MV3 separada.

## Camadas

1. **Presentation** — `app/`, `components/`
2. **Application** — `services/`, API routes
3. **Domain** — `schemas/`, regras de negócio em services
4. **Infrastructure** — `lib/prisma.ts`, `lib/blob.ts`, `lib/auth.ts`

## Autenticação

- Auth.js Credentials provider
- Sessão JWT para web
- Bearer token JWT para extensão (`/api/auth/extension-token`)

## Prevenção de duplicidade

Constraint `@@unique([employeeId, qru])` no Prisma + dialog na UI/extensão.

## Cálculo da folha

```
netTotal = (grossTotal × percentage/100) + costAllowance - voucher - inss - coparticipation - otherDiscounts
```

Recalculado automaticamente ao alterar serviços ou salvar folha.
