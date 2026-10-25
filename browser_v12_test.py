"""v1.2 phone-size browser regression: poster canvas/image, tempo persistence, end replay safety."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
html=(ROOT/'临界点_v12_超燃回响版.html').read_text(encoding='utf-8')
errors=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  shim="""<script>
  const _store=new Map([['profmonkey-critical-v07-tutorial-base','1']]);
  Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store.has(k)?_store.get(k):null,setItem:(k,v)=>_store.set(k,String(v)),removeItem:k=>_store.delete(k)}});
  </script>"""
  page.set_content(html.replace('</head>',shim+'</head>',1));page.wait_for_timeout(250)
  for _ in range(3):
    if page.locator('#tutorialBackdrop.visible').count():
      page.wait_for_function("() => !document.getElementById('tutorialStart').disabled",timeout=18000)
      page.locator('#tutorialStart').click()
  assert page.locator('#pace').get_attribute('aria-pressed')=='true'
  page.locator('#pace').click()
  assert page.locator('#pace').get_attribute('aria-pressed')=='false'
  assert page.evaluate("localStorage.getItem('profmonkey-critical-v12-pace')")=='classic'
  page.locator('#pace').click()
  assert page.locator('#pace').get_attribute('aria-pressed')=='true'
  # Live poster: no progress mutation and PNG is a valid non-trivial bitmap.
  before=(page.locator('#moves').inner_text(),page.locator('#score').inner_text())
  page.locator('#posterTop').click()
  assert page.locator('#posterBackdrop.visible').count()==1
  assert page.locator('#posterCanvas').evaluate('(c)=>c.width===720&&c.height===1280')
  png=page.locator('#posterCanvas').evaluate("c=>c.toDataURL('image/png')")
  assert png.startswith('data:image/png;base64,') and len(png)>10000
  page.locator('#posterCanvas').screenshot(path=str(ROOT/'临界点_v12_成绩海报.png'))
  with page.expect_download(timeout=15000) as dl:
    page.locator('#posterDownload').click()
  assert dl.value.suggested_filename.endswith('.png')
  page.locator('#posterClose').click()
  assert (page.locator('#moves').inner_text(),page.locator('#score').inner_text())==before
  # At least one real explosion enables replay. Run to final screen to enable end replay.
  for turn in range(12):
    if page.locator('#endBackdrop.visible').count():break
    near=page.locator('.cell[data-v="3"]:not([disabled])')
    target=near.first if near.count() else page.locator('.cell:not([disabled])').first
    target.click(force=True)
    page.wait_for_function("() => !document.getElementById('board').classList.contains('busy')",timeout=20000)
  page.wait_for_timeout(500)
  assert page.locator('#endBackdrop.visible').count()==1, 'expected game end after 12 moves'
  oldScore=page.locator('#score').inner_text();oldMoves=page.locator('#moves').inner_text();oldBoard=page.locator('#board').inner_text()
  assert not page.locator('#endReplay').is_disabled(), 'last move should explode when targeting a 3'
  page.locator('#endReplay').click()
  page.wait_for_function("() => !document.getElementById('board').classList.contains('busy')",timeout=20000)
  assert page.locator('#endBackdrop.visible').count()==1
  assert (page.locator('#score').inner_text(),page.locator('#moves').inner_text(),page.locator('#board').inner_text())==(oldScore,oldMoves,oldBoard)
  page.locator('#endPoster').click()
  assert page.locator('#posterBackdrop.visible').count()==1
  label=page.locator('#posterCanvas').evaluate("c=>c.toDataURL('image/png').length")
  assert label>10000
  page.locator('#posterCanvas').screenshot(path=str(ROOT/'临界点_v12_战绩成品.png'))
  page.locator('#posterClose').click()
  assert not errors,errors
  page.locator('#endClose').click()
  page.screenshot(path=str(ROOT/'临界点_v12_手机预览.png'),full_page=True)
  print('PASS: mobile 390x844 / tempo persistence / offline PNG poster / save PNG / no scoring mutation / final high-light replay / no runtime errors')
  browser.close()