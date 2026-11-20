# Nasil Vana Store — e-commerce de moda feminina

Loja virtual completa da Nasil Vana Store (Sinop, MT): vitrine editorial, catálogo com filtros, página de produto, sacola, checkout com **Mercado Pago (Pix e cartão)**, painel administrativo, SEO técnico e LGPD.

> **Status:** pronto para configurar e publicar. O que depende de contas da proprietária (Mercado Pago, domínio, e-mail, CNPJ) está implementado e documentado, mas precisa das credenciais dela. Veja [Antes de publicar](#antes-de-publicar).

## Stack e por quê

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Aplicação | Next.js 16 (App Router, React 19.3, Cache Components) | SSR/streaming para SEO, Server Actions com proteção de origem, um único projeto para loja + painel. |
| Banco | PostgreSQL 16 + Drizzle ORM | Transações e restrições reais (estoque nunca negativo, totais conferidos por `CHECK`). Drizzle: SQL tipado, sem binário extra. |
| Pagamento | Mercado Pago **Checkout Pro** (redirecionamento) | Cartão digitado só no ambiente do MP (loja fora do escopo pesado de PCI), Pix e parcelamento nativos, antifraude do MP. |
| Imagens | `sharp` → AVIF + WebP em várias larguras | Uploads são decodificados e **reencodados** (bloqueia arquivos maliciosos, remove EXIF/GPS). |
| Armazenamento | Disco (VPS) ou S3/R2 | Configurável por variável de ambiente. |
| Senhas | Argon2id (parâmetros OWASP) | |
| Animações | CSS + IntersectionObserver + View Transitions do React | Zero biblioteca de animação → JS menor, melhor INP no celular. |
| Fontes | DM Serif Display + Jost, auto-hospedadas | Sem requisição ao Google Fonts (LGPD e velocidade). |

## Rodando localmente

Requisitos: Node 22.12+, PostgreSQL 15+.

```bash
npm install
cp .env.example .env.local          # preencha DATABASE_URL e APP_SECRET
npm run db:migrate                  # cria as tabelas
npm run db:seed                     # catálogo inicial + páginas-modelo
npm run admin:create -- --email voce@email.com --name "Seu Nome"   # mostra senha temporária
npm run dev                         # http://localhost:3000 e /admin
```

## Testes

```bash
npm test            # 23 testes unitários (preços, cupons, frete, CPF, assinatura do webhook, markdown seguro)
npm run test:e2e    # 15 testes de ponta a ponta com navegador real (ver e2e/run.mjs para subir o mock)
```

Os testes E2E usam um **simulador do Mercado Pago** (`e2e/mock-mercadopago.mjs`) que assina webhooks com HMAC como o real. Cobrem: compra aprovada, webhook repetido (idempotência), webhook com assinatura falsa, pagamento com valor adulterado, pagamento recusado + expiração da reserva, duas clientes disputando a última peça, cupom com limite, preservação do formulário em erro, login/força bruta, CSRF e cabeçalhos de segurança.

## Estrutura

```
src/app/(store)/        loja: home, /loja, /loja/[categoria], /produto/[slug], /checkout, /pedido/[token], páginas
src/app/admin/          painel (login, pedidos, produtos, cupons, frete, banners, páginas, configurações, usuários)
src/app/api/webhooks/   webhook do Mercado Pago
src/lib/                regras: orders.ts (estoque/pagamento), mercadopago.ts, pricing.ts, cart.ts, seo.ts…
src/db/schema.ts        modelo de dados (com restrições)
seed/                   catálogo inicial a partir dos materiais enviados pela loja
docs/                   guias de configuração e operação
deploy/                 Docker Compose + Caddy (HTTPS) + backup
```

## Antes de publicar

Checklist completo no painel (Visão geral) e em [docs/DEPLOY.md](docs/DEPLOY.md). Resumo:

1. **Fotos reais das peças** — as atuais são de divulgação, provavelmente geradas por IA e em baixa resolução ([docs/FOTOGRAFIA.md](docs/FOTOGRAFIA.md)).
2. **Estoque real** — o seed cadastrou 1 unidade por variação anunciada nos pôsteres (os pôsteres não informam quantidade).
3. Razão social, CNPJ, endereço, e-mail e WhatsApp (Painel → Configurações) — exigidos pelo Decreto 7.962/2013.
4. Formas de entrega e valores (Painel → Frete) — estão **desativadas** até você definir preços.
5. Credenciais do Mercado Pago e webhook ([docs/PAGAMENTOS.md](docs/PAGAMENTOS.md)).
6. Revisão jurídica das políticas (são modelos; campos pendentes aparecem como “[informação pendente]”).
7. Produtos em rascunho: *Conjunto Alfaiataria com Fivela* (faltam tamanhos/preço das cores azul e bege), *Conjunto Assimétrico Vinho* (falta preço e tamanho).

Documentação: [Pagamentos](docs/PAGAMENTOS.md) · [Publicação](docs/DEPLOY.md) · [Manual do painel](docs/PAINEL.md) · [Google/SEO](docs/GOOGLE.md) · [Segurança e LGPD](docs/SEGURANCA.md) · [Fotografia](docs/FOTOGRAFIA.md) · [Frete](docs/FRETE.md)
