# Cler Ateliê Botânico — site

Site de uma página da Cler Ateliê Botânico: eternização de buquês e flores em resina, biojoias botânicas e peças decorativas. Todo o conteúdo e a comunicação com a cliente são em português do Brasil.

## Estrutura

```
Site/          site de produção, estático e sem build — é a fonte da verdade
  index.html
  layout.css
  script.js    carregado com defer
  assets/      somente imagens usadas no site, nomes descritivos em minúsculas
  admin/       painel do catálogo (/admin/), sem estilos do site
data/products.json          catálogo — fonte dos produtos (editado pelo painel)
lib/                        catalog.js (validação e geração), admin.js (API do painel), storage.js (GitHub ou disco)
api/admin.js                função da Vercel em /api/admin
scripts/
  build-catalog.js          regenera os trechos do catálogo em Site/ a partir de data/products.json
  admin-local.js            servidor local do site + painel, gravando direto nos arquivos
vercel.json                 publica Site/ como raiz e configura a função do painel
docs/
  LEVANTAMENTO-AJUSTES.md   pedidos da cliente, decisões e pendências de validação
  Ajustes-contexto/         conversa (_chat.txt) e capturas da cliente — só local, ignorada pelo Git
tests/verify.py             verificação automática do site no navegador
old/                        material antigo, apenas referência
  mockup-original/          mockup aprovado antes dos ajustes (index.html + Assets/)
  build-site.py             OBSOLETO — gerou a primeira versão de Site/
```

## Regras de trabalho

- Edite `Site/` diretamente, exceto o catálogo (veja abaixo). Não rode `old/build-site.py`: ele regeneraria o site a partir do mockup antigo e perderia as edições.
- Nada fora de `Site/` deve ser referenciado pelo site. Arquivos novos de imagem vão para `Site/assets/` com caminho relativo (`assets/...`).
- Não use estilos inline no HTML; o teste falha se houver atributo `style`.
- Preserve a identidade aprovada: variáveis de cor em `:root` de `layout.css` (`--ivory`, `--moss`, `--sage`, `--gold`...), tipografia Cormorant Garamond (títulos) e Manrope (texto).
- Textos enviados pela cliente são publicados na íntegra, sem reescrever. Fonte: `docs/Ajustes-contexto/_chat.txt` e o levantamento. Grafia padrão: **buquê** (nunca "bouquê").
- `.env.local` e `.vercel/` são da Vercel: não ler, não commitar, não copiar para `Site/`.
- `docs/Ajustes-contexto/` contém a conversa privada da cliente: nunca publicar nem copiar para `Site/`.

## Catálogo

A fonte é `data/products.json` (preço em **centavos**: `17990` = R$ 179,90; `width`/`height` da foto). A partir dele são gerados, entre marcadores, dois trechos que **não devem ser editados à mão**:

1. Array `PRODUCTS` em `Site/script.js`, entre `/* catalog:start */` e `/* catalog:end */`.
2. Cartões `.product-card` em `Site/index.html`, entre `<!-- catalog:cards:start -->` e `<!-- catalog:cards:end -->`, mais o contador `#collection-count`. Garantem o catálogo sem JavaScript.

Depois de mudar o JSON à mão: `node scripts/build-catalog.js` (ou `--check` para só conferir). Os grupos são fixos (`biojoias`, `acessorios`, `decoracao`, iguais aos filtros) e cada um sugere uma categoria: "Biojoia botânica autoral", "Acessório botânico" e "Decoração botânica".

### Painel (`/admin/`)

A cliente lista, cria, edita, reordena e remove produtos. A foto é reduzida no navegador (máx. 1600 px, JPG) e salva como `Site/assets/<id>-<sufixo>.jpg`; fotos que deixam de ser usadas no catálogo, no HTML e no CSS são apagadas. Os textos que ela digita são publicados como estão.

- **Produção:** `api/admin.js` faz um commit no GitHub com o JSON, os arquivos gerados e a foto; a Vercel republica sozinha (~1 min). Cada alteração fica no histórico (`Catálogo: adiciona …`) e pode ser desfeita com `git revert`. Puxe (`git pull`) antes de editar o site localmente.
- **Local:** `npm run admin` → http://127.0.0.1:4173/admin/ (senha `cler-local` ou `ADMIN_PASSWORD`). Grava direto nos arquivos; depois é só fazer commit.
- Variáveis na Vercel: `ADMIN_PASSWORD` (senha do painel; trocar desloga todo mundo) e `GITHUB_TOKEN` (token *fine-grained* só deste repositório, permissão *Contents: Read and write*). Opcionais: `GITHUB_REPO`, `GITHUB_BRANCH`.

## Fluxo comercial

Não há checkout, frete nem pagamento no site. A sacola guarda os itens no `localStorage` (`cler.boutique.cart.v1`) e monta uma mensagem para o WhatsApp com itens, quantidades e subtotal; frete, disponibilidade e pagamento são combinados no atendimento. Nenhum texto pode dizer que o pedido foi confirmado ou pago.

- Número oficial: `WHATSAPP_NUMBER` em `Site/script.js`, só dígitos, formato `55` + DDD + número. Atual: `555192049433` (+55 51 9204-9433).
- Com número vazio ou inválido, os botões mostram "O contato do ateliê estará disponível em breve." em vez de abrir o WhatsApp.
- Botões de contato usam `data-whatsapp="<assunto>"`; o link é montado pelo script.
- Instagram oficial: `@clerateliebotanico`.

## Verificação

```
python tests/verify.py
```

Requer `playwright` (com Chromium) e `beautifulsoup4`. O script sobe um servidor local para `Site/` e confere: IDs únicos, imagens existentes, ausência de rolagem horizontal em 1440/1024/768/600/390/320 px, filtros, detalhe do produto, sacola (quantidades, persistência, dados corrompidos), galeria, menu mobile, FAQ, mensagem do WhatsApp e catálogo sem JavaScript. Capturas de tela ficam em `%TEMP%\cler-producao-qa`.

O teste troca o número do WhatsApp por um fictício e intercepta `wa.me`: nenhuma mensagem real é enviada. Mantenha assim em qualquer teste novo.

Os números do teste (total de produtos, por grupo, preços da sacola) vêm de `data/products.json`, e ele roda `build-catalog.js --check` se houver Node. Rode a verificação depois de qualquer alteração no site e olhe as capturas de celular quando mexer em textos longos.

## Publicação

O projeto está ligado à Vercel pela pasta raiz (`.vercel/`). O `vercel.json` publica `Site/` como raiz e a função `api/admin.js`; o *Root Directory* do projeto na Vercel deve ser a raiz do repositório. Domínio definitivo ainda não definido.

## Pendências

- Confirmar se o WhatsApp é `9204-9433` ou `99204-9433` (testar `https://wa.me/555192049433` no celular).
- Validações da cliente listadas na seção 4 de `docs/LEVANTAMENTO-AJUSTES.md`: preços, pares da galeria, FAQ, assinatura do rodapé, decisões da videochamada.
- Primeiro deploy com `vercel.json`: conferir que o site abre em `/` e o painel em `/admin/`, com `ADMIN_PASSWORD` e `GITHUB_TOKEN` configurados. Definir o domínio.
