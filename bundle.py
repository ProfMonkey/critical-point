from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="theme.css">', '<style>\n'+(root/'theme.css').read_text(encoding='utf-8')+'\n</style>')
for name in ('engine.js','campaign.js','game.js','tutorial.js'):
    html=html.replace(f'<script src="{name}"></script>', f'<script>\n{(root/name).read_text(encoding="utf-8")}\n</script>')
out=root/'临界点_v11_战术预览版.html'
out.write_text(html,encoding='utf-8')
print(out,out.stat().st_size)