# Colocar a loja no ar pela Netlify (passo a passo simples)

Você vai precisar de: conta no **GitHub** (o código já está lá), conta na **Netlify** e conta no **Neon** (o banco de dados, grátis). Tempo: uns 15 minutos.

O deploy faz sozinho: cria as tabelas, cadastra o catálogo inicial com as fotos e cria o login da dona.

---

## Parte 1 — Criar o banco de dados (Neon)

1. Entre em **https://neon.tech** e clique em **Sign up** → entre com o GitHub.
2. Clique em **Create project**.
   - Nome: `nasil-vana-store`
   - Região: **AWS US East (N. Virginia)**
   - Clique em **Create**.
3. Na tela do projeto, clique em **Connect** (ou “Connection string”).
4. Deixe ligada a opção **Connection pooling**.
5. Copie o texto que começa com `postgresql://...` e guarde. Esse é o seu **endereço do banco**.

---

## Parte 2 — Criar o site na Netlify

1. Entre em **https://app.netlify.com** → **Add new site** → **Import an existing project** → **GitHub**.
2. Escolha o repositório **jarvis**.
3. Em **Branch to deploy**, escolha **`claude/nasil-vana-store-ecommerce-2sdded`**.
4. **Não mexa** em Build command nem em Publish directory (já está configurado).
5. Clique em **Add environment variables** e crie estas 3:

| Key (nome) | Value (valor) |
| --- | --- |
| `DATABASE_URL` | o endereço do banco copiado do Neon |
| `ADMIN_EMAIL` | o e-mail que a dona vai usar para entrar no painel |
| `ADMIN_PASSWORD` | uma senha provisória com **12 caracteres ou mais** |

6. Clique em **Deploy**. Espere uns 2–3 minutos até aparecer **Published**.

---

## Parte 3 — Testar

1. Abra o endereço que a Netlify mostrou (algo como `https://nome-aleatorio.netlify.app`). A loja tem que aparecer com as fotos.
2. Abra o mesmo endereço com **`/admin`** no final.
3. Entre com o `ADMIN_EMAIL` e a `ADMIN_PASSWORD`. O painel vai pedir uma senha nova — crie uma senha forte. A senha provisória deixa de valer.

Pronto: o site está no ar. **Ainda não vende**: faltam as 2 etapas abaixo.

---

## Depois (quando tiver os dados da dona)

**Dados da loja e frete — no próprio painel, sem programador:**
- Painel → **Configurações**: razão social, CNPJ, WhatsApp, e-mail, Instagram, endereço.
- Painel → **Frete**: ativar retirada na loja / entrega em Sinop e definir os valores.
- Painel → **Produtos**: conferir estoque real e fotos.

**Pagamento (Mercado Pago) — na Netlify:**
1. Siga [PAGAMENTOS.md](PAGAMENTOS.md) para pegar o **Access Token** e a **assinatura secreta**.
2. Netlify → seu site → **Site configuration → Environment variables** → adicione `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `CRON_SECRET` (qualquer frase longa e aleatória).
3. **Deploys → Trigger deploy → Deploy site** (variável nova só vale depois de um novo deploy).

**Domínio próprio (ex.: www.nasilvanastore.com.br):** Netlify → **Domain management → Add a domain** e siga as instruções. O HTTPS é automático. Depois adicione a variável `SITE_URL` com `https://www.seudominio.com.br` e faça um novo deploy.

---

## Se der erro

- **O deploy falhou**: Netlify → Deploys → clique no deploy com erro → leia as últimas linhas do log. O erro mais comum é `DATABASE_URL` copiada errada (faltando pedaço).
- **A loja abre mas dá erro na página**: confira se as variáveis foram criadas e faça **Trigger deploy**.
- **Esqueceu a senha do painel**: no Neon, abra **SQL Editor** e rode `DELETE FROM admin_sessions; DELETE FROM admin_users;`. Faça um novo deploy: o login é recriado a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

---

## Detalhes técnicos (para quem for dar manutenção)

- Comando de build: `npm run build:netlify` = `drizzle-kit migrate` + `seed/run.ts` (só popula se o banco estiver vazio) + `next build`.
- Fotos enviadas pelo painel ficam no **Netlify Blobs** (armazenamento da própria Netlify) e são cacheadas na CDN. As fotos do catálogo inicial são geradas a cada build como arquivos estáticos (`public/media/media/seed-*`).
- Padrões automáticos na Netlify: `SITE_URL` = URL do site, `APP_SECRET` derivado do `DATABASE_URL` se não informado, pool de 3 conexões, sem *prepared statements* (compatível com o pooler do Neon), fotos até 1600 px.
- Limites da plataforma já tratados: requisição ≤ 6 MB (foto reduzida no navegador), função ≤ 10 s (processamento ≈ 2,6 s/foto), disco temporário (Blobs).
- Função agendada `netlify/functions/expirar-pedidos.mts` (a cada 5 min, exige `CRON_SECRET`).
- Custos: a Netlify cobra por créditos; cada visita executa função (preço/estoque ao vivo). Acompanhe em **Usage**. Funções nos EUA (~150 ms a mais para Sinop).
- Validado localmente: banco vazio → build cria tudo → login com troca de senha obrigatória → segundo build não duplica nada. Não validado: execução real na Netlify e o Netlify Blobs (dependem da conta).
