# Extração — Extensão Chrome

## Estratégia resiliente

Para cada campo (QRU, serviço, valores, data), o pipeline tenta em ordem:

1. **Label adjacente** — busca keywords em labels/th/td e lê valor ao lado
2. **Regex no texto visível** — `document.body.innerText`
3. **Regex no HTML** — fallback com innerHTML
4. **Null** — campo vazio com baixa confiança

## Score de confiança

- ≥ 0.9: label encontrado
- ≥ 0.7: regex no texto
- ≥ 0.5: regex no HTML
- < 0.6: destacado em amarelo no popup para revisão manual

## Campos extraídos

| Campo | Keywords | Regex |
|-------|----------|-------|
| QRU / QRA | qra, qru | Código numérico (ex: 119431) |
| Serviço | ordem de serviço | `01/4339106-26` |
| Valor | custos da ordem de serviço | `R$ 181,00` |
| Data | data de abertura | `30/06/2026` |

## Portal suportado

- `https://portosocorro.my.site.com/prestador/s/workorder/...` (Salesforce)
- Domínios `*.portoseguro.com.br` e `*.porto/*`

## Fluxo

1. Usuário abre serviço no portal
2. Clica na extensão → Capturar
3. Seleciona funcionário
4. Revisa campos (especialmente baixa confiança)
5. Confirma envio
6. API valida server-side (nunca confiar na extensão)

## Manutenção

Se o portal mudar, ajuste `FIELD_KEYWORDS` e `REGEX` em `extension/src/content/content.js` — pequenas mudanças não quebram toda a extração.
