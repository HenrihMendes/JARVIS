/**
 * Função agendada da Netlify: a cada 5 minutos libera o estoque de pedidos não pagos
 * cujo prazo de reserva venceu. Requer CRON_SECRET nas variáveis de ambiente.
 */
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return new Response("CRON_SECRET ou URL ausentes", { status: 500 });
  const res = await fetch(`${base}/api/cron/expirar-pedidos`, { headers: { authorization: `Bearer ${secret}` } });
  return new Response(await res.text(), { status: res.status });
};

export const config = { schedule: "*/5 * * * *" };
