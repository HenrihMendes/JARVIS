# Pagamentos — Mercado Pago (Checkout Pro)

## Como funciona

1. A cliente finaliza o pedido na loja → o servidor recalcula preços, frete e cupom, **reserva o estoque** (transação no banco) e cria uma *preferência* no Mercado Pago.
2. A cliente paga no ambiente do Mercado Pago (Pix, cartão com parcelamento, saldo MP). **Os dados do cartão nunca passam pela loja.**
3. O Mercado Pago envia um **webhook** para `/api/webhooks/mercadopago`. A loja:
   - confere a assinatura `x-signature` (HMAC-SHA256 com a sua assinatura secreta);
   - **ignora o conteúdo da notificação** e consulta o pagamento na API do MP (`GET /v1/payments/{id}`);
   - confere `external_reference` (id do pedido), moeda BRL e **valor exato**;
   - só então marca o pedido como pago. Valor divergente → pedido vai para “Requer atenção”.
4. Notificações repetidas não duplicam efeitos (idempotência por id do pagamento + data de atualização).
5. Se o pagamento não for confirmado no prazo de reserva (padrão 60 min, configurável), o pedido expira e o estoque volta.
6. Ao voltar do MP, a página do pedido também consulta a API do MP (caso o webhook atrase) — nunca confia nos parâmetros da URL.

## Configuração (proprietária)

1. Crie/entre na sua conta Mercado Pago (de preferência conta **PJ** vinculada ao CNPJ).
2. Acesse **Mercado Pago Developers → Suas integrações → Criar aplicação** (produto: *Checkout Pro*).
3. Em **Credenciais de teste**, copie o *Access Token* (`TEST-...` ou `APP_USR-...` de teste) → variável `MP_ACCESS_TOKEN`.
4. Em **Webhooks**, configure a URL `https://www.seudominio.com.br/api/webhooks/mercadopago` com o evento **Pagamentos**. Copie a **assinatura secreta** → `MP_WEBHOOK_SECRET`.
5. Faça compras de teste com as contas/cartões de teste que o painel do MP fornece (comprador de teste ≠ vendedor).
6. Para vender de verdade: ative as **credenciais de produção**, troque `MP_ACCESS_TOKEN`, cadastre o webhook também no modo produção e reinicie a aplicação.

> As credenciais ficam **apenas em variáveis de ambiente** do servidor. Nunca as envie por WhatsApp/e-mail nem as coloque no código.

## Decisões

- **Boleto desativado por padrão**: compensa em até 3 dias úteis, o que conflita com a reserva de estoque curta. Pode ser ativado no painel (aumente a reserva).
- **Parcelamento**: a loja só exibe “em até Nx” se você configurar o número no painel; juros dependem da configuração da sua conta MP. Escreva “sem juros” apenas se você assumir os juros.
- **Reembolso**: botão no pedido (somente proprietária) chama a API de reembolso do MP; o status muda quando o MP confirma.
- **Stripe** não foi escolhido: para lojas brasileiras pequenas, o MP oferece Pix nativo, parcelamento local e menor atrito de cadastro.

## Testes automatizados

`e2e/mock-mercadopago.mjs` simula os endpoints do MP (incluindo webhooks assinados) apenas para testes. Em produção a loja fala com `https://api.mercadopago.com`.
