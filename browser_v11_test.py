from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
html=(ROOT/'临界点_v11_战术预览版.html').read_text(encoding='utf-8')
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on('pageerror',lambda e:errors.append(str(e)))
    shim="<script>const _store=new Map([['profmonkey-critical-v07-tutorial-base','1'],['profmonkey-critical-v07-tutorial-dailyQuests','1']]);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store.has(k)?_store.get(k):null,setItem:(k,v)=>_store.set(k,String(v)),removeItem:k=>_store.delete(k)}});</script>"
    page.set_content(html.replace('</head>',shim+'</head>',1)); page.wait_for_timeout(200)
    if page.locator('#tutorialBackdrop.visible').count():
      page.wait_for_function("() => !document.querySelector('#tutorialStart').disabled")
      page.locator('#tutorialStart').click()
    assert page.locator('#score').inner_text()=='0'
    target=int(page.locator('.cell[data-v="3"]').first.evaluate('(e) => Array.from(e.parentElement.children).indexOf(e)'))
    pre=page.locator('#moves').inner_text()
    page.locator('#forecast').click()
    assert page.locator('#forecast').get_attribute('aria-pressed')=='true'
    page.locator('.cell').nth(target).click(force=True)
    assert not page.locator('#predictionConfirm').is_hidden()
    assert page.locator('#predictionDetail').inner_text().startswith('预计 +')
    assert page.locator('#moves').inner_text()==pre
    assert page.locator('#score').inner_text()=='0'
    selected=page.locator('.cell').nth(target)
    assert 'forecast-selected' in (selected.get_attribute('class') or '')
    page.locator('#predictionCancel').click()
    assert page.locator('#forecast').get_attribute('aria-pressed')=='false'
    assert page.locator('#moves').inner_text()==pre
    page.locator('#forecast').click();page.locator('.cell').nth(target).click(force=True)
    page.locator('#predictionConfirm').click()
    page.wait_for_function("() => !document.getElementById('board').classList.contains('busy')",timeout=20000)
    assert int(page.locator('#moves').inner_text())==int(pre)-1
    score=page.locator('#score').inner_text();moves=page.locator('#moves').inner_text()
    assert not page.locator('#replayLast').is_disabled()
    page.locator('#replayLast').click()
    page.wait_for_function("() => !document.getElementById('board').classList.contains('busy')",timeout=20000)
    assert page.locator('#score').inner_text()==score
    assert page.locator('#moves').inner_text()==moves
    page.locator('#restart').click()
    assert page.locator('#replayLast').is_disabled()
    assert page.locator('#forecast').get_attribute('aria-pressed')=='false'
    assert not errors,errors
    page.screenshot(path=str(ROOT/'临界点_v11_手机预览.png'),full_page=True)
    print('BROWSER PASS: opt-in forecast, preview no move, cancel, confirm, last-turn replay no scoring, reset, no JS errors')
    browser.close()