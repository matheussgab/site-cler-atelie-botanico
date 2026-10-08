from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json, tempfile, re, threading, subprocess, shutil

# Uso: python tests/verify.py  (requer playwright e beautifulsoup4)
ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'Site'
# O catálogo muda pelo painel: os testes leem data/products.json em vez de números fixos.
PRODUCTS=json.loads((ROOT/'data'/'products.json').read_text('utf-8'))
first,second=PRODUCTS[0],PRODUCTS[1]
group_count=lambda group:sum(product['group']==group for product in PRODUCTS)
brl=lambda cents:'R$ '+f'{cents//100:,}'.replace(',','.')+f',{cents%100:02d}'
if shutil.which('node'):
    subprocess.run(['node',str(ROOT/'scripts'/'build-catalog.js'),'--check'],check=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(SITE)))
threading.Thread(target=server.serve_forever,daemon=True).start()
out=Path(tempfile.gettempdir())/'cler-producao-qa'; out.mkdir(exist_ok=True)
base=f'http://127.0.0.1:{server.server_port}/'
source=(SITE/'index.html').read_text('utf-8')
soup=BeautifulSoup(source,'html.parser')
ids=[n['id'] for n in soup.select('[id]')]
assert len(ids)==len(set(ids))
for node in soup.select('[src]'):
    assert (SITE/node['src']).is_file(),node['src']
assert not soup.select('[style], #checkout-dialog, #shipping-form, #contact-dialog')
errors=[]
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(base); page.wait_for_load_state('networkidle')
    page.evaluate('''async () => {
      const images = [...document.images];
      images.forEach(img => { img.loading = 'eager'; });
      await Promise.all(images.filter(img => img.getAttribute('src')).map(img => img.decode()));
    }''')
    assert page.locator('.product-card').count()==len(PRODUCTS)
    assert page.locator('.instagram-feed a:visible').count()==4
    assert page.locator('.gallery-item').count()==6
    for width in [1440,1024,768,600,390,320]:
        page.set_viewport_size({'width':width,'height':1000})
        page.evaluate('window.scrollTo(0,0)'); page.wait_for_timeout(100)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Horizontal overflow: {width}'
        assert page.locator('.instagram-feed a:visible').count()==4
        page.screenshot(path=str(out/f'page-{width}.png'),full_page=True)
        results.append(f'Layout {width}px: OK')
    page.set_viewport_size({'width':1440,'height':1000})
    for selector,name in [('#eternizacao','eternizacao'),('#nossa-historia','universo'),('#colecoes','colecoes'),('#faq','faq')]:
        page.locator(selector).screenshot(path=str(out/f'{name}-desktop.png'))
    page.locator('[data-filter="biojoias"]').click()
    assert page.locator('.product-card:visible').count()==group_count('biojoias')
    page.locator('[data-filter="decoracao"]').click()
    assert page.locator('.product-card:visible').count()==group_count('decoracao')
    page.locator('[data-filter="all"]').click()
    page.locator(f'[data-product="{first['id']}"]').click()
    assert page.locator('#product-dialog').evaluate('(d)=>d.open')
    assert page.locator('#detail-category').text_content()==first['category']
    page.locator('#detail-plus').click()
    page.locator('#add-to-cart').click()
    assert page.locator('#cart-subtotal').inner_text().replace('\xa0',' ')==brl(first['price']*2)
    assert page.locator('#cart-dialog').evaluate('(d)=>d.open')
    page.keyboard.press('Escape')
    page.wait_for_function('!document.body.classList.contains("locked")')
    page.reload(); page.locator('#open-cart').click()
    assert page.locator('#bag-count').inner_text()=='2'
    page.locator('[data-cart-action="decrease"]').click()
    assert page.locator('#cart-subtotal').inner_text().replace('\xa0',' ')==brl(first['price'])
    page.locator('[data-cart-action="remove"]').click()
    assert page.locator('#cart-footer').is_hidden()
    page.keyboard.press('Escape')
    page.locator('[data-gallery]').first.click()
    assert page.locator('#lightbox-image').get_attribute('src').endswith('flores-secas.jpg')
    page.keyboard.press('Escape')
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#open-menu').click()
    page.locator('#mobile-menu nav a[href="#colecoes"]').click()
    assert not page.locator('#mobile-menu').evaluate('(d)=>d.open')
    page.locator('.faq-list summary').first.click()
    assert page.locator('.faq-list details').first.evaluate('(d)=>d.open')
    results.append('Filters, product, quantities, cart persistence/removal, gallery, mobile menu, FAQ: OK')
    # Corrupted storage must not break startup.
    page.evaluate('localStorage.setItem("cler.boutique.cart.v1", "broken")')
    page.reload(); assert page.locator('#bag-count').inner_text()=='0'
    page.evaluate('localStorage.setItem("cler.boutique.cart.v1", JSON.stringify([{id:"%s",quantity:1000},{id:"unknown",quantity:2}]))' % first['id'])
    page.reload(); assert page.locator('#bag-count').inner_text()=='99'
    results.append('Invalid storage and quantity normalization: OK')
    context.close()
    # WhatsApp transport tested with a fixture only in memory. No messages sent.
    context=browser.new_context()
    js=re.sub(r"const WHATSAPP_NUMBER = '[0-9]*';","const WHATSAPP_NUMBER = '5511999999999';",(SITE/'script.js').read_text('utf-8'))
    context.route('**/script.js',lambda route:route.fulfill(body=js,content_type='text/javascript'))
    context.route('https://wa.me/**',lambda route:route.fulfill(body='Intercepted locally',content_type='text/plain'))
    page=context.new_page(); page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(base)
    page.locator(f'[data-product="{second['id']}"]').click(); page.locator('#detail-plus').click()
    href=page.locator('#buy-now').get_attribute('href')
    message=parse_qs(urlparse(href).query)['text'][0]
    total=brl(second['price']*2)[3:]
    assert f"2 × {second['name']}" in message and total in message
    page.locator('#add-to-cart').click()
    href=page.locator('#request-cart').get_attribute('href')
    message=parse_qs(urlparse(href).query)['text'][0]
    assert 'Frete não incluído.' in message and total in message
    with page.expect_popup() as popup: page.locator('#request-cart').click()
    popup.value.close()
    assert page.locator('#bag-count').inner_text()=='2'
    assert len(json.loads(page.evaluate('localStorage.getItem("cler.boutique.cart.v1")')))==1
    results.append('WhatsApp fixture: encoded item/quantity/subtotal, new tab, selection retained: OK')
    context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page(); page.goto(base)
    assert page.locator('.product-card:visible').count()==len(PRODUCTS)
    assert page.locator('#open-cart').is_hidden()
    assert page.locator('#open-menu').is_hidden()
    results.append('Static catalogue without JavaScript: OK')
    context.close(); browser.close()
assert not errors,errors
server.shutdown()
print(json.dumps({'results':results,'errors':errors,'screenshots':str(out)},ensure_ascii=False,indent=2))
