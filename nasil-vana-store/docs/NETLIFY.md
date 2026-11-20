# Publicação na Netlify

A Netlify roda Next.js em **funções serverless** (AWS Lambda). Isso muda três coisas em relação a um servidor comum — e o projeto já está ajustado para elas:

| Limitação da Netlify | Consequência | O que já foi feito |
| --- | --- | --- |
| Disco das funções é temporário | Fotos enviadas pelo painel **sumiriam** | Use armazenamento S3 (Cloudflare R2) — `STORAGE_DRIVER=s3` |
| Requisição máx. **6 MB** | Foto de celular não sobe | O painel reduz a foto **no navegador** antes de enviar |
| Função máx. **10 s** (padrão) | Processar imagem grande estoura o tempo | `IMAGE_MAX_WIDTH=1600` (≈ 2,6 s por foto em 1 núcleo) |
| Não há “servidor sempre ligado” | Tarefas periódicas precisam de agendamento | `netlify/functions/expirar-pedidos.mts` roda a cada 5 min |
| Muitas conexões ao banco | Cada função abre a sua | Banco com *pooler* (Neon) + `DATABASE_POOL_MAX=3` |

Testado no ambiente de desenvolvimento: `netlify build` com o adaptador oficial (`@netlify/plugin-nextjs` 5.16.6) **compilou o Next 16.4.6 e gerou as funções**. A etapa de empacotar o *proxy* como Edge Function não pôde ser concluída lá (sem acesso à internet para baixar o Deno) — confira no primeiro deploy.

## Passo a passo

### 1. Banco de dados — Neon (PostgreSQL serverless)
- Crie um projeto em neon.tech (plano gratuito serve para começar) na região **AWS US East (N. Virginia) `us-east-1`** — a mesma região padrão das funções da Netlify (menos latência entre site e banco).
- Copie a string de conexão **com pooling** (host contém `-pooler`), com `?sslmode=require`.
- (A Netlify também oferece o “Netlify DB”, que é Neon por baixo; qualquer um serve.)

### 2. Imagens — Cloudflare R2 (10 GB grátis, sem custo de saída)
- Crie um bucket (ex.: `nasil-media`) e ative o acesso público (domínio `r2.dev` ou, melhor, um subdomínio seu como `cdn.seudominio.com.br`).
- Crie um token de API com permissão de leitura/escrita **só nesse bucket**.

### 3. Criar tabelas e o catálogo inicial (no seu computador, uma vez)
```bash
cd nasil-vana-store
npm install
# .env.local com as MESMAS variáveis de produção (DATABASE_URL do Neon, S3_*, STORAGE_DRIVER=s3, APP_SECRET...)
npm run db:migrate
npm run db:seed                       # envia as fotos tratadas para o R2
npm run admin:create -- --email dona@email.com --name "Nome da Dona"   # anote a senha temporária
```

### 4. Site na Netlify
- **Add new site → Import from Git** → repositório → **Base directory: `nasil-vana-store`** (o resto vem do `netlify.toml`).
- **Environment variables** (Site configuration → Environment variables):

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | string do Neon com `-pooler` e `?sslmode=require` |
| `DATABASE_POOL_MAX` | `3` |
| `DATABASE_PREPARE` | `false` (exigido pelo pooler) |
| `SITE_URL` | `https://www.seudominio.com.br` (ou o `https://xxx.netlify.app` provisório) |
| `APP_SECRET` | `openssl rand -base64 48` |
| `STORAGE_DRIVER` | `s3` |
| `S3_ENDPOINT` | `https://<id-da-conta>.r2.cloudflarestorage.com` |
| `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | do token do R2 |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | URL pública do bucket (ex.: `https://cdn.seudominio.com.br`) |
| `IMAGE_MAX_WIDTH` | `1600` |
| `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` | ver [PAGAMENTOS.md](PAGAMENTOS.md) |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` / `EMAIL_FROM` | opcional (e-mails de pedido) |

> Marque as variáveis secretas como *secret* na Netlify. `NEXT_PUBLIC_MEDIA_BASE_URL` precisa existir **antes** do build.

- Faça o deploy. Depois, em **Domain management**, conecte o domínio (o HTTPS é automático) e atualize `SITE_URL` + redeploy.

### 5. Mercado Pago
Cadastre o webhook `https://www.seudominio.com.br/api/webhooks/mercadopago` (evento **Pagamentos**). Faça uma compra de teste completa antes de anunciar.

### 6. Conferência pós-deploy
- [ ] Home, produto e checkout abrem (e o `/admin` pede login)
- [ ] Enviar uma foto pelo painel e vê-la na loja (testa R2 + limite de 6 MB + tempo da função)
- [ ] Compra de teste aprovada vira “Pagamento aprovado” no painel (testa webhook)
- [ ] Em **Logs → Functions**, a função `expirar-pedidos` aparece rodando a cada 5 min

## Custos e pontos de atenção (seja realista)
- A Netlify passou a cobrar por **créditos** (deploys, banda e execuções de função consomem créditos). O plano gratuito tem um limite mensal de créditos; uma loja pequena com tráfego vindo do Instagram tende a caber no começo, mas **acompanhe o consumo** em *Usage* — se estourar, o site pode ser pausado até o mês seguinte ou exigir o plano Pro.
- Todas as páginas da loja são renderizadas por requisição (preço e estoque sempre atualizados), então cada visita usa execução de função. Uma VPS ([DEPLOY.md](DEPLOY.md)) tem custo fixo e não tem esses limites.
- As funções ficam nos EUA; para quem está em Sinop isso soma ~150 ms por página. Aceitável, mas um servidor no Brasil seria mais rápido.
