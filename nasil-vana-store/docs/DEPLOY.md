# Publicação

## Opção recomendada: VPS com Docker (≈ R$ 30–60/mês)

Banco, loja e HTTPS automático em um servidor (ex.: Hostinger, Contabo, DigitalOcean — prefira datacenter no Brasil).

```bash
git clone <repo> && cd nasil-vana-store
cp .env.example .env            # preencha (SITE_URL com https, APP_SECRET, MP_*, CRON_SECRET)
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env
cd deploy && nano Caddyfile     # troque seudominio.com.br
docker compose --env-file ../.env up -d --build
docker compose exec app npx drizzle-kit migrate
docker compose exec app npx tsx seed/run.ts
docker compose exec app npx tsx scripts/create-admin.ts --email voce@email.com --name "Seu Nome"
```

- **Domínio**: aponte registros `A` de `seudominio.com.br` e `www` para o IP do servidor. O Caddy emite o certificado sozinho.
- **Tarefa agendada** (libera reservas vencidas): `*/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://www.seudominio.com.br/api/cron/expirar-pedidos`
  (A loja também expira pedidos “sob demanda”, mas a tarefa garante a liberação mesmo sem visitas.)
- **Backup diário**: `deploy/backup.sh` no crontab + cópia externa. Teste a restauração.
- **Atualizações**: `git pull && docker compose up -d --build && docker compose exec app npx drizzle-kit migrate`.
- **Firewall**: libere só 22, 80 e 443. O banco não é exposto.

> O Dockerfile não pôde ser executado no ambiente de desenvolvimento (sem Docker); o build de produção (`next build`) foi validado.

## Alternativa gerenciada

Vercel **Pro** (o plano gratuito Hobby **proíbe uso comercial**) + Neon/Supabase (PostgreSQL) + Cloudflare R2 (`STORAGE_DRIVER=s3`) + Vercel Cron chamando `/api/cron/expirar-pedidos`. Mais caro (US$ 20+/mês) e mais peças para gerenciar.

## Antes de abrir as vendas

- [ ] Fotos reais e estoque real cadastrados
- [ ] Razão social, CNPJ, endereço, e-mail, WhatsApp (Configurações)
- [ ] Frete com valores e faixas de CEP (Frete)
- [ ] Políticas revisadas por advogado(a)
- [ ] Mercado Pago em produção + webhook cadastrado + uma compra real de valor baixo, reembolsada em seguida
- [ ] E-mails (RESEND_API_KEY + domínio verificado no Resend)
- [ ] Senha forte e usuário próprio para cada pessoa da equipe
- [ ] Backup agendado e testado
- [ ] Emissão de **nota fiscal**: não faz parte deste sistema — use o emissor da sua contabilidade/ERP (ou integre Bling/Tiny depois)
