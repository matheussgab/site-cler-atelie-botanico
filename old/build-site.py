# OBSOLETO: gerou a primeira versão de Site/ a partir do mockup original (01/10/2026).
# Não executar: Site/ agora é editado diretamente e seria sobrescrito.
from pathlib import Path
from bs4 import BeautifulSoup, Comment
import re, json, subprocess, shutil, textwrap

root = Path(__file__).parent
site = root / 'Site'
(site / 'assets').mkdir(parents=True, exist_ok=True)
original = (root / 'index.html').read_text(encoding='utf-8')
soup = BeautifulSoup(original, 'html.parser')
css = soup.style.string
oldjs = soup.script.string
soup.style.replace_with(soup.new_tag('link', rel='stylesheet', href='layout.css'))
soup.script.replace_with(soup.new_tag('script', src='script.js', defer=True))
for c in soup.find_all(string=lambda x: isinstance(x, Comment)): c.extract()

def content(selector, html):
    node = soup.select_one(selector)
    assert node is not None, selector
    node.clear()
    for item in list(BeautifulSoup(html, 'html.parser').contents): node.append(item)

def fragment(html): return BeautifulSoup(html, 'html.parser')
def add_after(selector, html): soup.select_one(selector).insert_after(fragment(html))

assets = {
 'Assets/logo.jpeg':'logo-cler.jpg', 'Assets/image-1.jpeg':'noiva-buque.jpg',
 'Assets/image-7.jpeg':'buque-preservado.jpg', 'Assets/image-14.jpg':'presilha-flores.jpg',
 'Assets/image-15.jpg':'colar-girassol.jpg', 'Assets/image-16.jpg':'colar-cosmos.jpg',
 'Assets/image-17.jpg':'colar-orquidea-lilas.jpg', 'Assets/image-18.jpg':'colar-orquidea-translucida.jpg',
 'Assets/image-19.jpg':'conjunto-sakura.jpg', 'Assets/image-20.jpg':'luminaria-jardim.jpg'
}
newphotos = {
 12:'memoria-buque-lilas.jpg',16:'bandeja-orquideas.jpg',31:'flores-secas.jpg',32:'memoria-circular-rosa.jpg',
 33:'girassol-preservado.jpg',34:'girassol-natural.jpg',35:'memoria-madeira-resina.jpg',36:'rosa-natural.jpg',
 63:'buque-rosas-orquideas.jpg',64:'memoria-flor-clara.jpg',65:'colar-girassol-embalagem.jpg',66:'memoria-fotografia.jpg'
}
for src,dest in assets.items(): shutil.copy2(root/src,site/'assets'/dest)
for prefix,dest in newphotos.items(): shutil.copy2(next((root/'Ajustes-contexto').glob(f'{prefix:08d}-*.jpg')),site/'assets'/dest)

content('#hero-title','Flores que <em>guardam histórias.</em><span class="hero-subtitle">Arte que transforma memórias em eternidade.</span>')
content('.hero-copy > p','Cada flor carrega um instante.<br>Nós preservamos o significado que existe nele.')
add_after('.hero-copy > p','<p>Na Cler Ateliê Botânico, transformamos flores que fizeram parte de momentos especiais em peças únicas, criadas artesanalmente para que a beleza, a emoção e a história possam continuar presentes.</p>')
content('.hero-buttons .text-link','Conheça nossas criações')
soup.select_one('.hero-buttons .btn')['data-contact']='Eternização de buquê'
photo=soup.select_one('.hero-inset img'); photo['src']='assets/'+newphotos[12]; photo['alt']='Peça hexagonal com flores lilases preservadas e acessórios de casamento'; photo.attrs.pop('width',None); photo.attrs.pop('height',None)
soup.select_one('.hero-inset .photo')['class']=['photo']

content('.manifesto-copy','''<span class="eyebrow">O que nos move</span><h2 id="manifesto-title">Algumas flores fazem parte de um momento.<br>Outras passam a fazer parte <em>da nossa história.</em></h2><p>Um casamento. Uma conquista. Um encontro.<br>Um presente inesperado. Uma despedida. Uma lembrança que merece permanecer.</p><p>Na Cler, acreditamos que algumas flores carregam muito mais do que beleza. Elas carregam sentimentos, pessoas e histórias que não queremos esquecer.</p><p>Por isso, cada flor que chega ao nosso ateliê é recebida com cuidado e transformada em uma peça única — feita para preservar não apenas a flor, mas aquilo que ela representa para você.</p><p class="manifesto-ending">Porque o tempo passa.<br>A memória permanece.</p>''')
photo=soup.select_one('.manifesto-image img'); photo['src']='assets/'+newphotos[16]; photo['alt']='Bandeja de resina com orquídeas roxas e amarelas preservadas'; photo.attrs.pop('width',None); photo.attrs.pop('height',None)
content('.preservation-copy','''<span class="eyebrow line">Eternização de buquês</span><h2 id="preservation-title">Seu buquê não precisa terminar <em>naquele dia.</em></h2><p>Depois da celebração, as flores podem ganhar uma nova forma — e continuar contando a história de um momento que merece permanecer.</p><p>Na Cler, cada flor é recebida com cuidado, respeito e intenção. A partir das suas flores, criamos uma peça única, pensada para preservar não apenas a beleza, mas o significado que existe por trás dela.</p><p class="preservation-personal">Cada história recebe uma criação só sua.</p>''')
soup.select_one('#eternizacao').append(fragment('''<div class="wrap preservation-continuation"><div><span class="eyebrow">Uma criação só sua</span><h3>Da sua história,<br>nasce uma <em>peça única.</em></h3></div><div><p>Cada buquê é diferente. Cada flor carrega uma lembrança. E cada história merece uma forma especial de permanecer.</p><p>Criamos composições em resina que transformam flores significativas em memórias que podem ser vistas, tocadas e revisitadas ao longo dos anos.</p><p>Do delicado ao marcante, da preservação fiel à composição autoral, a criação nasce das suas flores e da história que elas carregam.</p><div class="possibilities">Composições em resina · Obras botânicas · Peças decorativas · Biojoias · Lembranças personalizadas</div><a class="btn btn-light" data-contact="Eternização de buquê">Quero preservar minhas flores</a><span class="small">Conte-nos a sua história. Juntos, encontramos a forma de eternizá-la.</span></div></div><p class="wrap preservation-essence">Não preservamos apenas flores.<br><em>Preservamos o que elas significam.</em></p>'''))
content('.process-intro > p','Cada flor carrega uma história.<br>Por isso, cada eternização começa ouvindo a sua.')
steps=[('Conversa','Queremos conhecer a história por trás das flores e entender o que torna esse momento tão especial para você.'),('Acolhimento das flores','Recebemos suas flores com cuidado e avaliamos cada elemento, respeitando suas características e possibilidades de preservação.'),('Criação','A partir da sua história e das suas flores, pensamos juntos em uma composição que tenha significado para você.'),('Preservação','Cada elemento passa por um processo cuidadoso de preparação e preservação, pensado para manter sua beleza e essência.'),('Arte','É aqui que a memória ganha forma. Cada peça é criada artesanalmente, detalhe por detalhe, respeitando a identidade das suas flores.'),('O encontro','E então, aquilo que um dia foi um momento volta para você transformado em uma peça para guardar, contemplar e lembrar.')]
for node,(title,body) in zip(soup.select('.process li'),steps): node.h3.string=title; node.p.string=body
content('#historias .section-heading > p','Porque na Cler, não preservamos apenas flores.<br>Preservamos aquilo que elas significam.')
gallery=[(31,'Flores e suas lembranças','Flores secas em um recipiente'),(32,'Memória em uma nova forma','Peça circular de resina com flores e borda rosa'),(34,'A beleza do instante','Girassol natural segurado pela mão'),(33,'Um girassol que permanece','Girassol preservado em bloco transparente de resina'),(36,'Delicadeza em flor','Rosa rosa em um vaso'),(35,'Natureza, memória e arte','Peça de madeira e resina com flor vermelha preservada')]
for i,(node,(num,caption,alt)) in enumerate(zip(soup.select('.gallery-item'),gallery),1):
    node['class']=['gallery-item','reveal']
    node.select_one('.photo')['class']=['photo','gallery-photo']
    button=node.button; button['data-gallery']='assets/'+newphotos[num]; button['data-caption']=caption; button['aria-label']='Ampliar: '+alt
    node.img['src']=button['data-gallery']; node.img['alt']=alt
    node.img.attrs.pop('width',None); node.img.attrs.pop('height',None)
    node.figcaption.clear(); node.figcaption.append(fragment(f'<span>{caption}</span><span>{i:02d}</span>'))
    if num==35: node.select_one('.photo')['class'].append('contain-photo')
content('.story-copy p','A Cler Ateliê Botânico nasceu para transformar flores carregadas de significado em memórias que podem ser tocadas, contempladas e guardadas.')
soup.select('.story-copy p')[1].string='Cada criação nasce do encontro entre natureza, sensibilidade e fazer artesanal. Aqui, cada flor é recebida como parte de uma história — e cada detalhe é pensado para que essa história permaneça.'
content('.story-caption','Uma memória para levar junto de você.<span>Biojoias botânicas feitas com flores naturais, transformadas em peças únicas.</span>')
soup.select_one('#nossa-historia').append(fragment('''<div class="wrap services"><article><span class="eyebrow">Biojoias botânicas</span><p>Flores naturais transformadas em joias para carregar uma história junto de você.</p></article><article><span class="eyebrow">Eternização de buquês</span><p>O seu buquê, preservado para que a emoção daquele dia continue presente.</p></article><article><span class="eyebrow">Memórias em resina</span><p>Flores e elementos naturais transformados em peças únicas, criadas a partir da sua história.</p></article></div>'''))
for node,txt in zip(soup.select('.pillar p'),['Tudo começa com algo que a natureza criou.','E, muitas vezes, uma flor carrega muito mais do que beleza: carrega um momento, uma pessoa, uma história.','Nas mãos da Cler, essa memória ganha uma nova forma — feita com sensibilidade, cuidado e trabalho artesanal.']): node.string=txt
content('#collections-title','A natureza transformada em peças<br>para levar <em>uma história com você.</em>')
content('#colecoes .section-heading > p','Flores naturais encontram o fazer artesanal para criar peças únicas — delicadas, autorais e cheias de significado.')
soup.select_one('#colecoes noscript').decompose()
content('.instagram-heading .eyebrow','Entre flores, memórias e novos capítulos')
content('.instagram-bottom p','Um pouco das histórias que florescem no ateliê.')
content('.instagram-bottom .text-link','Acompanhe a Cler no Instagram')
insta=soup.select('.instagram-feed a'); insta[-1].decompose()
for node,num,alt in zip(insta[:4],[63,64,65,66],['Buquê de rosas amarelas e orquídeas preservado em resina','Peça circular transparente com flor clara preservada','Colar de girassol na embalagem da Cler','Flores e fotografia preservadas em uma peça retangular']):
    node.img['src']='assets/'+newphotos[num]; node.img['alt']=alt
    node.img.attrs.pop('width',None); node.img.attrs.pop('height',None)
    node['aria-label']='Ver a Cler no Instagram (abre em nova aba)'
content('#faq-title','Cuidamos das suas flores.<br><em>E de tudo o que envolve essa história.</em>')
content('.faq-intro > p','Cada história é única, e sabemos que surgem muitas dúvidas ao confiar a nós algo tão especial.<br>Estamos aqui para conversar, orientar e cuidar de cada detalhe com você.')
answers=['Quanto antes, melhor. As flores continuam se transformando depois do corte, por isso o tempo pode influenciar o processo de preservação. Converse com a Cler sobre a data do seu evento e orientaremos a melhor forma de encaminhar suas flores.','Em alguns casos, sim. Cada flor e cada história são avaliadas individualmente. Envie uma foto para a Cler e veremos juntas as possibilidades de preservação.','Antes de enviar, converse conosco. Orientaremos você sobre os cuidados, a embalagem e a melhor forma de encaminhar suas flores para que cheguem ao ateliê com todo o cuidado que merecem.','Cada história tem seu próprio tempo. O prazo depende das flores, da técnica escolhida e do projeto. Depois de avaliarmos seu caso, informaremos o prazo previsto para sua criação.','Sim. A criação nasce do encontro entre a sua história e o nosso olhar artesanal. Conversamos sobre suas preferências, suas flores e o significado daquele momento para encontrar a forma que melhor representa a sua memória.']
for node,txt in zip(soup.select('.faq-list details p'),answers): node.string=txt
soup.select('.faq-list details p')[-1].string='As formas e condições de pagamento são combinadas diretamente com o ateliê pelo WhatsApp, junto à confirmação de disponibilidade e frete.'
content('#contact-title','Algumas flores duram pouco.<br>As histórias que elas carregam<br><em>podem durar para sempre.</em>')
soup.select_one('.contact-actions .text-link').decompose()
content('.footer-bottom span:last-child','Flores que guardam histórias. Arte que transforma memórias em eternidade.')

# All commercial actions lead to the same official WhatsApp channel.
for selector in ['.header-cta','.story-copy .text-link','.mobile-nav > .btn']:
    soup.select_one(selector)['data-contact']='Eternização de buquê'
for node in soup.select('[data-contact]'):
    node.name='a'; node['href']='#contato'; node['data-whatsapp']=node['data-contact']; del node['data-contact']
    node['target']='_blank'; node['rel']='noopener noreferrer'; node['aria-label']=node.get_text(' ',strip=True)+' — WhatsApp (abre em nova aba)'
for selector in ['#checkout-dialog','#contact-dialog','#shipping-form']: soup.select_one(selector).decompose()
content('#buy-now','Consultar pelo WhatsApp')
buy=soup.select_one('#buy-now'); buy.name='a'; buy['href']='#contato'; buy['target']='_blank'; buy['rel']='noopener noreferrer'
soup.select_one('.detail-info').append(fragment('<p class="commercial-note">Disponibilidade, frete e pagamento são confirmados com o ateliê pelo WhatsApp.</p>'))
content('#cart-footer > p','Frete, disponibilidade e pagamento confirmados pelo WhatsApp. Sua seleção permanece na sacola ao abrir a conversa.')
content('#start-checkout','Solicitar pelo WhatsApp')
cartlink=soup.select_one('#start-checkout'); cartlink['id']='request-cart'; cartlink.name='a'; cartlink['href']='#contato'; cartlink['target']='_blank'; cartlink['rel']='noopener noreferrer'
soup.select_one('#open-menu')['hidden']=True; soup.select_one('#open-cart')['hidden']=True
soup.select_one('.collection-tools')['hidden']=True

# Static product cards keep the catalogue usable before JavaScript loads.
product_src=re.search(r'const PRODUCTS = (\[.*?\n      \]);',oldjs,re.S).group(1)
products=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify('+product_src+'))'],encoding='utf-8'))
invite='''<aside class="collection-invite"><span class="brand-mark"><img src="assets/logo-cler.jpg" alt="" loading="lazy"></span><h3>Suas flores.<br>Suas memórias.<br><em>Uma criação só sua.</em></h3><p><strong>Cada flor carrega uma história.</strong></p><p>Na Cler, transformamos flores que fizeram parte de momentos especiais em peças que permitem que essas memórias continuem presentes.</p><a class="text-link" href="#contato" data-whatsapp="Projeto personalizado" target="_blank" rel="noopener noreferrer">Quero preservar minha história</a></aside>'''
from html import escape
cards=[]
for p in products:
    p['image']='assets/'+assets[p['image']]
    if p['group']=='biojoias': p['category']='Biojoia botânica autoral'
    price=f"R$ {p['price']/100:.2f}".replace('.',',')
    cards.append(f'''<article class="product-card" data-group="{p['group']}"><a href="#contato" data-product="{p['id']}" data-whatsapp="{escape(p['name'])}" aria-label="Consultar {escape(p['name'])}, {price}"><div class="product-image"><img src="{p['image']}" alt="{escape(p['alt'])}" loading="lazy"><span class="product-open" aria-hidden="true">+</span></div><h3>{escape(p['name'])}</h3><span class="product-category">{p['category']}</span><span class="product-price">{price}</span></a></article>''')
content('#products-grid','\n'.join(cards)+invite)
soup.select_one('.collection-footnote').append(' Disponibilidade sob consulta pelo WhatsApp.')

for node in soup.select('[style]'):
    if node.name=='button' or node.name=='a': node['class']=node.get('class',[])+['inline-contact']
    else: node['class']=node.get('class',[])+['sr-only']
    del node['style']
for node in soup.select('[src], [href], [data-gallery]'):
    for attr in ['src','href','data-gallery']:
        if node.get(attr) in assets: node[attr]='assets/'+assets[node[attr]]
for img in soup.select('img'): img['decoding']='async'
soup.select_one('meta[name=description]')['content']='Flores que guardam histórias. Arte que transforma memórias em eternidade. Eternização de buquês, biojoias e memórias em resina. Conheça a Cler Ateliê Botânico.'
for prop,val in [('og:title','Cler Ateliê Botânico — Flores que guardam histórias'),('og:description',soup.select_one('meta[name=description]')['content']),('og:type','website'),('og:locale','pt_BR')]: soup.head.append(soup.new_tag('meta',property=prop,content=val))

# Remove obsolete styles for the deleted checkout, payment, shipping and contact forms.
unused=r'checkout|shipping|summary-product|summary-totals|grand-total|mock-card|card-fields|success-content|success-symbol|contact-dialog|contact-result|simulation-note|loading-dot|\.choice|\.fields|\.field|fieldset|legend|\.error'
css=re.sub(r'([^{}]+)\{([^{}]*)\}',lambda m: '' if re.search(unused,m[1]) and not m[1].lstrip().startswith('@') else m[0],css)
css=css.replace('.product-card>button','.product-card>a').replace('.product-card button:hover','.product-card a:hover')
css=css.replace('.instagram-feed a:last-child{display:none}','')
css+='''
/* Conteúdo aprovado e atendimento pelo WhatsApp. */
.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.inline-contact{text-decoration:underline;text-underline-offset:3px;padding:0}
.hero h1{font-size:clamp(44px,4.5vw,68px);max-width:640px}
.hero-subtitle{display:block;font-size:.67em;line-height:1.15;margin-top:22px;letter-spacing:-.025em}
.hero-copy>p{max-width:460px}.hero-copy>p+p{margin-top:16px}
.hero-inset .photo>img{object-fit:contain;background:var(--ivory)}
.manifesto{grid-template-columns:minmax(0,1fr) minmax(210px,.45fr);gap:70px}
.manifesto-copy{display:block}.manifesto h2{font-size:clamp(35px,3.5vw,51px)}
.manifesto p{margin-top:20px;max-width:670px}.manifesto .manifesto-ending{font-family:var(--serif);font-size:28px;color:var(--moss);line-height:1.2}
.manifesto-image .photo{height:auto;aspect-ratio:3/4}.manifesto-image .photo>img{position:absolute;inset:0}
.preservation-copy p+p{margin-top:18px}.preservation-personal{font-style:italic}
.preservation-continuation{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,8vw,120px);border-top:1px solid #c7cbb940;margin-top:65px;padding-top:55px}
.preservation-continuation h3{font-size:clamp(36px,3.5vw,52px);margin-top:20px}.preservation-continuation h3 em{color:#c3ccb5}
.preservation-continuation p{max-width:none}.preservation-continuation p+p{margin-top:16px}
.preservation .preservation-essence{font-family:var(--serif);font-size:clamp(26px,3vw,38px);text-align:center;max-width:none;padding-top:55px;line-height:1.2}
.gallery-item .gallery-photo{height:auto!important;aspect-ratio:4/5}.gallery-photo>img{position:absolute;inset:0}
.gallery .contain-photo>img{object-fit:contain}.gallery-item figcaption span:first-child{max-width:85%}
.story-visual{padding:0}.story-visual::before{display:none}.story-visual .photo{aspect-ratio:1193/1318}.story-visual .photo img{object-fit:contain}
.story-caption{position:static;background:none;padding:22px 0 0;font-size:26px;line-height:1.2}
.story-caption span{display:block;font-family:var(--sans);font-style:normal;font-size:12px;line-height:1.8;color:var(--taupe);margin-top:12px}
.services{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px;border-top:1px solid var(--line);padding-top:35px;margin-top:55px}.services p{font-size:12px;margin-top:13px}
.product-card h3{margin-top:15px}.product-category{margin:8px 0 0;line-height:1.6}.product-price{margin-top:8px}
.collection-invite{grid-column:1/-1;min-height:0;display:grid;grid-template-columns:.8fr 1fr;gap:12px 50px;padding:38px 45px}.collection-invite .brand-mark{display:none}.collection-invite h3{grid-row:1/4;margin:0;font-size:40px}.collection-invite .text-link{justify-self:start;margin-top:0;font-size:10px}.collection-invite p{font-size:12px}
.instagram-feed{grid-template-columns:repeat(4,minmax(0,1fr))}.instagram-feed a{aspect-ratio:3/4}.instagram-feed img{object-fit:contain}.instagram-feed .photo{background:#e5e0d4}
.faq-intro p{max-width:340px}.faq-intro h2{font-size:clamp(36px,3.7vw,51px)}
.commercial-note{border-top:1px solid var(--line);padding-top:20px;margin-top:24px;font-size:12px}.detail-photo img{object-fit:contain;background:#e8e5d9}
.detail-actions .btn,.cart-footer .btn{font-size:11px;letter-spacing:.08em;padding-inline:18px}
.process h3{line-height:1.6}.footer-bottom span:last-child{max-width:520px}
@media(max-width:800px){.manifesto{gap:35px}.services{gap:22px}.preservation-continuation{gap:30px}.hero h1{font-size:46px}.collection-invite{padding:30px;gap:15px 30px}.collection-invite h3{font-size:34px}}
@media(max-width:600px){.hero h1{font-size:clamp(40px,11.5vw,58px)}.hero-subtitle{font-size:.7em}.hero-copy>p{max-width:none}.manifesto{display:block}.manifesto-copy{display:block}.manifesto h2{margin-top:22px}.manifesto-image{width:min(74%,280px);margin:30px 0 0 auto}.manifesto p{font-size:12px}.preservation-continuation{grid-template-columns:1fr;gap:24px;margin-top:40px;padding-top:35px}.preservation-continuation h3{font-size:38px}.preservation .preservation-essence{padding-top:38px}.services{grid-template-columns:1fr;gap:24px;margin-top:35px;padding-top:28px}.services article+article{border-top:1px solid var(--line);padding-top:24px}.instagram-feed{grid-template-columns:repeat(2,minmax(0,1fr))}.story-caption{font-size:26px}.story-visual{width:min(100%,380px)}.collection-invite{display:block;padding:28px}.collection-invite h3{font-size:36px;margin-bottom:20px}.collection-invite p+p{margin-top:12px}.collection-invite .text-link{margin-top:16px}.product-category{font-size:8px}.gallery .gallery-col .gallery-item{padding-top:0}.gallery-col:nth-child(2),.gallery-col:nth-child(3){padding-top:0}.btn{max-width:100%;overflow-wrap:anywhere}.preservation .btn{font-size:11px}.faq-intro h2{font-size:40px}}
'''

# Retain proven dialog/cart handling, replace all demonstration flows.
js=oldjs[:oldjs.index('      function resetShipping()')]
js=re.sub(r'      // FONTES COMERCIAIS:.*?      const PRODUCTS = \[.*?\n      \];','      const PRODUCTS = '+json.dumps(products,ensure_ascii=False,indent=2)+';',js,flags=re.S)
js=re.sub(r'      // SIMULAÇÃO DE FRETE:.*?      const STORAGE_KEY',"      const WHATSAPP_NUMBER = '555192049433'; // WhatsApp oficial: +55 51 9204-9433\n      const STORAGE_KEY",js,flags=re.S)
js=re.sub(r'      const digits =.*?      const normalizeCart', '      const normalizeCart',js,flags=re.S)
js=re.sub(r'      let selectedShipping.*?      let toastTimer;', '      let toastTimer;',js,flags=re.S)
js=re.sub(r"          if \(dialog.id === 'product-dialog'\).*?\n        \}\);",'        });',js,flags=re.S)
js=js.replace("        const contact = event.target.closest('[data-contact]');\n        if (contact) openContact(contact.dataset.contact);\n",'')
start=js.index('      const collectionInvite ='); end=js.index("      $$('.filter-btn')",start)
js=js[:start]+'''      function renderProducts(filter = 'all') {
        const cards = $$('.product-card');
        cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.group !== filter; });
        $('.collection-invite').hidden = filter !== 'all';
        const count = cards.filter(card => !card.hidden).length;
        $('#collection-count').textContent = `${count} ${count === 1 ? 'criação autoral' : 'criações autorais'}`;
      }
'''+js[end:]
js=js.replace("        if (button) openProduct(button.dataset.product, button);","        if (button) { event.preventDefault(); openProduct(button.dataset.product, button); }")
js=js.replace("        $('#detail-plus').disabled = selectedQuantity >= MAX_QUANTITY;","        $('#detail-plus').disabled = selectedQuantity >= MAX_QUANTITY;\n        setWhatsAppLink($('#buy-now'), productMessage(selectedProduct, selectedQuantity));")
js=js.replace("        resetShipping();\n        $('#shipping-form').reset();\n",'')
js=js.replace('O limite demonstrativo é de 99 unidades por criação. Ajuste a quantidade na sacola.','Para quantidades acima de 99 unidades, converse diretamente com o ateliê.')
js=js.replace("      $('#buy-now').addEventListener('click', () => { if (addSelectedProduct()) openCheckout(); });\n",'')
js=js.replace("        $('#cart-subtotal').textContent = money(subtotal());","        $('#cart-subtotal').textContent = money(subtotal());\n        updateCartLink();")
js+='''
      function whatsappURL(message) {
        return /^55[1-9][0-9]{9,10}$/.test(WHATSAPP_NUMBER)
          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` : '';
      }
      function setWhatsAppLink(link, message) {
        const url = whatsappURL(message);
        link.href = url || '#contato';
        link.dataset.whatsappReady = String(Boolean(url));
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      function productMessage(product, quantity) {
        return `Olá, Cler! Gostaria de consultar esta criação:\\n\\n${quantity} × ${product.name} — ${money(product.price)} por unidade\\nSubtotal: ${money(product.price * quantity)}\\n\\nPodem confirmar a disponibilidade, o frete e as formas de pagamento?`;
      }
      function updateCartLink() {
        const lines = cart.map(item => {
          const product = productById.get(item.id);
          return `${item.quantity} × ${product.name} — ${money(product.price)} por unidade — ${money(product.price * item.quantity)}`;
        });
        setWhatsAppLink($('#request-cart'), `Olá, Cler! Gostaria de consultar as criações da minha sacola:\\n\\n${lines.join('\\n')}\\n\\nSubtotal dos produtos: ${money(subtotal())}\\nFrete não incluído.\\n\\nPodem confirmar a disponibilidade, o frete e as formas de pagamento?`);
      }
      $$('[data-whatsapp]').forEach(link => setWhatsAppLink(link, `Olá, Cler! Gostaria de conversar sobre: ${link.dataset.whatsapp}.`));
      document.addEventListener('click', event => {
        const link = event.target.closest('[data-whatsapp-ready="false"]');
        if (link && !link.hasAttribute('data-product')) {
          event.preventDefault();
          showToast('O contato do ateliê estará disponível em breve.');
        }
      });
      window.addEventListener('storage', event => {
        if (event.storageArea !== localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
        try { cart = normalizeCart(JSON.parse(event.newValue || '[]')); } catch { cart = []; }
        renderCart();
      });
      function scrollBehavior() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
      const updateHeader = () => $('#site-header').classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', updateHeader, {passive:true});
      updateHeader();
      renderProducts();
      renderCart();
      $('#open-menu').hidden = false;
      $('#open-cart').hidden = false;
      $('.collection-tools').hidden = false;
      $$('[data-product]').forEach(link => { link.setAttribute('aria-haspopup', 'dialog'); link.setAttribute('aria-label', `Ver detalhes de ${productById.get(link.dataset.product).name}`); });
    })();
'''

(site/'index.html').write_text(str(soup),encoding='utf-8')
(site/'layout.css').write_text(textwrap.dedent(css).strip()+'\n',encoding='utf-8')
(site/'script.js').write_text(textwrap.dedent(js).strip()+'\n',encoding='utf-8')
print('Created Site with',len(products),'products and',len(assets)+len(newphotos),'images.')
