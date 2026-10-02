# Cler Ateliê Botânico — site

Site de uma página da Cler Ateliê Botânico: eternização de buquês e flores em resina, biojoias botânicas e peças decorativas. Todo o conteúdo e a comunicação com a cliente são em português do Brasil.

## Estrutura

```
Site/          site de produção, estático e sem build — é a fonte da verdade
  index.html
  layout.css
  script.js    carregado com defer
  assets/      somente imagens usadas no site, nomes descritivos em minúsculas
docs/
  LEVANTAMENTO-AJUSTES.md   pedidos da cliente, decisões e pendências de validação
  Ajustes-contexto/         conversa (_chat.txt) e capturas da cliente — só local, ignorada pelo Git
tests/verify.py             verificação automática do site no navegador
old/                        material antigo, apenas referência
  mockup-original/          mockup aprovado antes dos ajustes (index.html + Assets/)
  build-site.py             OBSOLETO — gerou a primeira versão de Site/
```

## Regras de trabalho

- Edite `Site/` diretamente. Não rode `old/build-site.py`: ele regeneraria o site a partir do mockup antigo e perderia as edições.
- Nada fora de `Site/` deve ser referenciado pelo site. Arquivos novos de imagem vão para `Site/assets/` com caminho relativo (`assets/...`).
- Não use estilos inline no HTML; o teste falha se houver atributo `style`.
- Preserve a identidade aprovada: variáveis de cor em `:root` de `layout.css` (`--ivory`, `--moss`, `--sage`, `--gold`...), tipografia Cormorant Garamond (títulos) e Manrope (texto).
- Textos enviados pela cliente são publicados na íntegra, sem reescrever. Fonte: `docs/Ajustes-contexto/_chat.txt` e o levantamento. Grafia padrão: **buquê** (nunca "bouquê").
- `.env.local` e `.vercel/` são da Vercel: não ler, não commitar, não copiar para `Site/`.
- `docs/Ajustes-contexto/` contém a conversa privada da cliente: nunca publicar nem copiar para `Site/`.

## Catálogo

Os 7 produtos existem em dois lugares, que precisam ficar sincronizados:

1. Array `PRODUCTS` no início de `Site/script.js` — preço em **centavos** (`17990` = R$ 179,90), categoria, descrição, especificações e imagem.
2. Cartões estáticos `.product-card` em `Site/index.html` — garantem o catálogo sem JavaScript.

Biojoias (4 colares + conjunto Sakura) usam a categoria "Biojoia botânica autoral". Presilha e luminária mantêm "Acessório botânico" e "Decoração botânica".

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

Rode a verificação depois de qualquer alteração no site e olhe as capturas de celular quando mexer em textos longos.

## Publicação

O projeto está ligado à Vercel pela pasta raiz (`.vercel/`). A raiz não tem mais `index.html`: antes de publicar, a Vercel precisa servir `Site/` como raiz (configuração do projeto ou `vercel.json`). Domínio definitivo ainda não definido.

## Pendências

- Confirmar se o WhatsApp é `9204-9433` ou `99204-9433` (testar `https://wa.me/555192049433` no celular).
- Validações da cliente listadas na seção 4 de `docs/LEVANTAMENTO-AJUSTES.md`: preços, pares da galeria, FAQ, assinatura do rodapé, decisões da videochamada.
- Configurar a Vercel para servir `Site/` e definir o domínio.
