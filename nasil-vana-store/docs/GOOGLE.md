# Google: SEO, Search Console, Analytics, Merchant Center, Perfil da Empresa

## Já implementado no site
- Títulos e descrições únicos por página (editáveis em produtos, categorias e páginas), URLs amigáveis (`/loja/vestidos`, `/produto/vestido-chemise-com-cinto`), canonical, Open Graph.
- `sitemap.xml` (com imagens) e `robots.txt` (bloqueia admin, checkout, carrinho e pedidos).
- Dados estruturados: Organization (ou ClothingStore/LocalBusiness quando o endereço é exibido), WebSite + busca interna, BreadcrumbList, Product / **ProductGroup** com Offer por variação (preço e disponibilidade reais), FAQPage. **Sem avaliações inventadas.**
- Páginas filtradas (`?cor=`, `?ordem=`) com `noindex` para não diluir o ranqueamento.
- Feed de produtos: `/feeds/google-merchant.xml` (uma entrada por cor/tamanho).

## Configuração
1. **Search Console**: adicione a propriedade de *Domínio* e verifique por DNS (registro TXT no seu provedor de domínio). Envie `https://www.seudominio.com.br/sitemap.xml`.
2. **Google Analytics 4**: crie a propriedade e cole o ID `G-XXXX` em Painel → Configurações. Só carrega depois que a visitante aceita cookies.
3. **Merchant Center**: crie a conta, verifique o site, configure frete e devoluções lá, e adicione o feed `/feeds/google-merchant.xml` (busca programada diária). Habilita listagens gratuitas no Google Shopping.
4. **Perfil da Empresa (Google Maps)**: se há loja física em Sinop, cadastre com o mesmo nome, endereço e telefone do site e ative “Mostrar endereço” em Configurações. Peça avaliações reais às clientes — é o fator mais forte para buscas locais.

## Palavras-chave — hipóteses organizadas por intenção (validar)
Não tive acesso a ferramentas de volume de busca (Keyword Planner/Search Console) neste ambiente; a lista abaixo são hipóteses a validar com dados reais após 4–8 semanas no ar.

| Intenção | Termos | Onde atacar |
| --- | --- | --- |
| **Local transacional** (prioridade) | loja de roupa feminina em Sinop, moda feminina Sinop MT, loja feminina Sinop | Home, Perfil da Empresa, página Contato |
| **Categoria transacional** | corset feminino, corset renda, corset floral, vestido chemise, conjunto alfaiataria feminino, colete feminino alfaiataria, saia midi | Páginas de categoria e produto |
| **Ocasião** | look para trabalho feminino, look para evento, roupa social feminina | Futuras páginas editoriais/guias |
| **Navegacional** | Nasil Vana, Nasil Vana Store | Garantido pelos dados de Organization |

Realismo: e-commerce nacional para “vestidos femininos” compete com gigantes; o caminho viável é **busca local + cauda longa** (nome exato de modelos) + Instagram/WhatsApp como canal principal de tráfego.
