# Segurança e LGPD

Segurança é processo contínuo; nenhum sistema é 100% seguro. Abaixo, o que está implementado e o que depende de operação.

## Implementado
| Risco (OWASP) | Controle |
| --- | --- |
| Injeção SQL | Drizzle ORM com consultas parametrizadas; nenhum SQL montado com texto do usuário. |
| XSS | React escapa toda saída; conteúdo editável usa markdown próprio que gera elementos React (sem `innerHTML`), links restritos a http(s)/mailto/tel/relativos; CSP restritiva. |
| CSRF | Server Actions com verificação de origem do Next + bloqueio no proxy de POST sem `Origin`; cookies `SameSite`. |
| Autenticação | Argon2id (OWASP), sessões aleatórias de 256 bits só com hash no banco, cookie `__Host-` HttpOnly/Secure/SameSite=Strict, expiração absoluta (12 h) e por inatividade (2 h), troca de senha obrigatória no 1º acesso, mesma resposta para e-mail inexistente (anti-enumeração). |
| Força bruta | Limite por IP e por conta no login (testado); limites também em checkout, cupom, CEP e newsletter. |
| Autorização | `requireAdmin()` em toda página e ação do painel (não só no menu); papéis proprietária/equipe; CPF mascarado para equipe. |
| Pagamento | Sem dados de cartão na loja; webhook com HMAC e consulta à API; valor/moeda/referência conferidos; idempotência. |
| Integridade de preço/estoque | Tudo recalculado no servidor; `CHECK` no banco (estoque ≥ 0, total = subtotal − desconto + frete); reserva atômica. |
| Upload | Decodificação real da imagem, limite de 15 MB e 60 MP, reencode AVIF/WebP (original descartado), metadados EXIF/GPS removidos, chave de arquivo validada contra path traversal. |
| Cabeçalhos | CSP, HSTS (preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP; `x-powered-by` removido. |
| Segredos | Somente em variáveis de ambiente; validação na inicialização. |
| Logs | Sem tokens, senhas ou dados de cartão; e-mails mascarados nos logs; IP guardado como hash (HMAC). |
| Auditoria | Registro de logins, alterações de produtos, status de pedidos, reembolsos e exportações. |
| Exportação CSV | Proteção contra injeção de fórmulas no Excel. |

## Limitações conhecidas (honestas)
- CSP usa `'unsafe-inline'` em scripts porque nonces são incompatíveis com o pré-render parcial do Next 16. Próximo passo: SRI experimental do Next.
- Sem autenticação em dois fatores no painel (recomendado adicionar TOTP se a equipe crescer).
- Rate limit em banco é suficiente para o porte da loja; sob ataque volumoso use Cloudflare na frente.
- Dependências precisam de atualização periódica (`npm audit`, Dependabot no GitHub).

## LGPD
- Coleta mínima: nome, e-mail, telefone, CPF (nota fiscal/antifraude) e endereço só quando há entrega.
- Consentimento separado e opcional para marketing (texto e data registrados). GA4 só após aceite.
- Direitos da titular: exportação (JSON) e anonimização no painel.
- Política de privacidade e de cookies como modelos — **revise com advogado(a)** e preencha os dados do controlador.
- Retenção: pedidos guardados por obrigação legal/fiscal; defina prazo com a contabilidade.
- Incidentes: comunique ANPD e titulares quando houver risco relevante.
