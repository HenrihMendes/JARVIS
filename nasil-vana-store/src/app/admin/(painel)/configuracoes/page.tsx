import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { env, paymentsConfigured, webhookSecretConfigured } from "@/lib/env";
import { AdminPage, Badge, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { saveSettingsAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Configurações" };

async function Forms() {
  const admin = await requireAdmin();
  const s = await getSettings();
  const owner = admin.role === "owner";
  const site = env.SITE_URL.replace(/\/$/, "");
  return (
    <div className="space-y-6">
      {!owner && <p className="text-sm text-warn">Somente a proprietária pode alterar as configurações.</p>}
      <Card title="Dados da loja">
        <ActionForm action={saveSettingsAction} className="grid gap-5 sm:grid-cols-2">
          <>
              <input type="hidden" name="_key" value="store" />
              <F label="Nome da loja" name="name" defaultValue={s.store.name} />
              <F label="Frase da marca" name="tagline" defaultValue={s.store.tagline} />
              <F label="Razão social" name="legalName" defaultValue={s.store.legalName} hint="Obrigatória no site (Decreto 7.962/2013)." />
              <F label="CNPJ" name="cnpj" defaultValue={s.store.cnpj} placeholder="00.000.000/0001-00" />
              <F label="E-mail de atendimento" name="email" type="email" defaultValue={s.store.email} />
              <F label="Telefone" name="phone" defaultValue={s.store.phone} />
              <F label="WhatsApp (com DDD)" name="whatsapp" defaultValue={s.store.whatsapp} placeholder="(66) 99999-9999" hint="Ativa os botões de WhatsApp na loja." />
              <F label="Instagram (@)" name="instagram" defaultValue={s.store.instagram} placeholder="@nasilvanastore" />
              <F label="Rua" name="addressStreet" defaultValue={s.store.addressStreet} />
              <F label="Número" name="addressNumber" defaultValue={s.store.addressNumber} />
              <F label="Complemento" name="addressComplement" defaultValue={s.store.addressComplement} />
              <F label="Bairro" name="addressDistrict" defaultValue={s.store.addressDistrict} />
              <F label="Cidade" name="addressCity" defaultValue={s.store.addressCity} />
              <F label="UF" name="addressState" defaultValue={s.store.addressState} maxLength={2} />
              <F label="CEP" name="addressCep" defaultValue={s.store.addressCep} />
              <F label="Link do Google Maps" name="mapsUrl" defaultValue={s.store.mapsUrl} />
              <F label="Horário de atendimento" name="openingHours" defaultValue={s.store.openingHours} placeholder="Seg a sex, 9h às 18h · Sáb, 9h às 13h" className="sm:col-span-2" />
              <input type="hidden" name="foundedYear" value={s.store.foundedYear} />
              <div className="sm:col-span-2"><Check label="Mostrar endereço da loja física no site (ativa dados de LocalBusiness para o Google)" name="showAddress" defaultChecked={s.store.showAddress} /></div>
              {owner && <div className="sm:col-span-2"><Submit>Salvar dados da loja</Submit></div>}
            </>
        </ActionForm>
      </Card>

      <Card title="Vendas">
        <ActionForm action={saveSettingsAction} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="_key" value="commerce" />
          <F label="Parcelamento máximo no cartão" name="maxInstallments" type="number" min={1} max={12} defaultValue={s.commerce.maxInstallments ?? ""} hint="Vazio = não exibir parcelamento na loja. Deve bater com o configurado na sua conta Mercado Pago." />
          <F label="Complemento do parcelamento" name="installmentNote" defaultValue={s.commerce.installmentNote} placeholder="sem juros" hint='Só escreva "sem juros" se você assumir os juros no Mercado Pago.' />
          <F label="Reserva de estoque (minutos)" name="reservationMinutes" type="number" min={15} max={1440} defaultValue={s.commerce.reservationMinutes} hint="Tempo para a cliente pagar antes de a peça voltar ao estoque." />
          <F label="Nome na fatura do cartão (até 13 letras)" name="statementDescriptor" maxLength={13} defaultValue={s.commerce.statementDescriptor} />
          <F label="Avisar estoque baixo a partir de" name="lowStockThreshold" type="number" min={0} defaultValue={s.commerce.lowStockThreshold} />
          <F label="Prazo de troca (dias)" name="exchangeDays" type="number" min={7} max={90} defaultValue={s.commerce.exchangeDays} />
          <F label="E-mail para avisos de novos pedidos" name="orderNotificationEmail" type="email" defaultValue={s.commerce.orderNotificationEmail} />
          <div className="space-y-3 sm:col-span-2">
            <Check label="Mostrar “Últimas unidades” quando o estoque estiver baixo (número real)" name="showLowStock" defaultChecked={s.commerce.showLowStock} />
            <Check label="Exigir CPF no checkout (recomendado: nota fiscal e antifraude)" name="requireCpf" defaultChecked={s.commerce.requireCpf} />
            <Check label="Aceitar boleto" name="acceptBoleto" defaultChecked={s.commerce.acceptBoleto} hint="Boleto leva até 3 dias úteis para compensar; aumente a reserva de estoque se ativar." />
          </div>
          {owner && <div className="sm:col-span-2"><Submit>Salvar vendas</Submit></div>}
        </ActionForm>
      </Card>

      <Card title="Aviso no topo do site">
        <ActionForm action={saveSettingsAction} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="_key" value="announcement" />
          <F label="Texto" name="text" defaultValue={s.announcement.text} placeholder="Ex.: Frete grátis em Sinop acima de R$ 300" />
          <F label="Link (opcional, ex.: /loja)" name="href" defaultValue={s.announcement.href} />
          <Check label="Exibir aviso" name="enabled" defaultChecked={s.announcement.enabled} />
          {owner && <div className="sm:col-span-2"><Submit>Salvar aviso</Submit></div>}
        </ActionForm>
      </Card>

      <Card title="Google e SEO">
        <ActionForm action={saveSettingsAction} className="grid gap-5">
          <input type="hidden" name="_key" value="seo" />
          <F label="Título padrão" name="defaultTitle" maxLength={70} defaultValue={s.seo.defaultTitle} />
          <F label="Descrição padrão" name="defaultDescription" as="textarea" rows={2} maxLength={170} defaultValue={s.seo.defaultDescription} />
          <input type="hidden" name="googleSiteVerification" value={s.seo.googleSiteVerification} />
          <p className="text-[0.8125rem] text-stone">Google Search Console: verifique o domínio por DNS (recomendado) ou defina a variável <code>GOOGLE_SITE_VERIFICATION</code> no servidor. Veja docs/GOOGLE.md.</p>
          <F label="Google Analytics 4 — ID de medição" name="ga4MeasurementId" defaultValue={s.seo.ga4MeasurementId} placeholder="G-XXXXXXXXXX" hint="Só carrega após consentimento da visitante (LGPD)." />
          <Check label="Gerar feed de produtos para o Google Merchant Center" name="merchantFeedEnabled" defaultChecked={s.seo.merchantFeedEnabled} hint={`${site}/feeds/google-merchant.xml`} />
          {owner && <Submit>Salvar SEO</Submit>}
        </ActionForm>
      </Card>

      <Card title="Pagamentos (Mercado Pago)">
        <div id="pagamentos" className="space-y-3 text-sm">
          <p className="flex items-center gap-3">Credencial de acesso <Badge tone={paymentsConfigured ? "ok" : "danger"}>{paymentsConfigured ? (env.MP_ACCESS_TOKEN?.startsWith("TEST-") ? "Configurada (TESTE)" : "Configurada") : "Ausente"}</Badge></p>
          <p className="flex items-center gap-3">Assinatura do webhook <Badge tone={webhookSecretConfigured ? "ok" : "danger"}>{webhookSecretConfigured ? "Configurada" : "Ausente"}</Badge></p>
          <p className="text-stone">
            Por segurança, as credenciais ficam em variáveis de ambiente do servidor (não no banco nem no painel): <code>MP_ACCESS_TOKEN</code> e <code>MP_WEBHOOK_SECRET</code>. No painel do Mercado Pago (Suas integrações → Webhooks), cadastre a URL{" "}
            <code className="break-all">{site}/api/webhooks/mercadopago</code> com o evento <strong>Pagamentos</strong>. Passo a passo em <code>docs/PAGAMENTOS.md</code>.
          </p>
        </div>
      </Card>

      <Card title="E-mails automáticos">
        <p id="email" className="flex items-center gap-3 text-sm">Envio de e-mails <Badge tone={env.RESEND_API_KEY ? "ok" : "warn"}>{env.RESEND_API_KEY ? "Ativo" : "Desativado"}</Badge></p>
        <p className="mt-2 text-sm text-stone">Configure <code>RESEND_API_KEY</code> e <code>EMAIL_FROM</code> para enviar confirmação de pedido e aviso de envio.</p>
      </Card>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <AdminPage title="Configurações" description="Dados exibidos no site, regras de venda e integrações. Campos vazios ficam ocultos na loja.">
      <Suspense fallback={<div className="skeleton h-96" />}><Forms /></Suspense>
    </AdminPage>
  );
}
