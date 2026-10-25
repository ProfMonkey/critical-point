/* 临界点 v1.2 — 原生 Canvas 离线战绩海报：不需要外部资源、不上传用户数据。 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const canvas=$('posterCanvas'), ctx=canvas.getContext('2d');
  if(!ctx)return;
  let record=null;
  const W=720,H=1280;
  const themes={
    neon:['#090719','#4f1b78','#ff4eb3','#ffcc81','#ae7cff'],
    solar:['#130909','#70280d','#ff7535','#ffe28f','#ffb338'],
    cyber:['#041619','#086f69','#19e6bb','#d9ff91','#52c9ff'],
    gold:['#130f09','#654716','#ffe089','#fff4b6','#bd9349']
  };
  const tileColors=['#242440','#264c85','#08776e','#ab495a','#9746b4','#cf8326'];
  function rounded(x,y,w,h,r=18){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function text(s,x,y,px,color,bold=800,align='left'){
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;
    ctx.font=`${bold} ${px}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(String(s),x,y);
  }
  function label(s,x,y,w,h,background,color,px=24){
    ctx.fillStyle=background;rounded(x,y,w,h,h/2);ctx.fill();text(s,x+w/2,y+h/2,px,color,850,'center');
  }
  function render(data){
    record=data;const colors=themes[data.skin]||themes.neon;
    ctx.clearRect(0,0,W,H);
    const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,colors[0]);grad.addColorStop(.52,'#110f24');grad.addColorStop(1,colors[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(560,145,40,540,200,520);glow.addColorStop(0,colors[2]+'70');glow.addColorStop(1,'#00000000');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    for(let i=0;i<45;i++){
      const x=(i*137)%W,y=(i*283)%H;
      ctx.fillStyle=i%3===0?'#ffffff19':colors[4]+'24';ctx.beginPath();ctx.arc(x,y,i%3===0?2.1:1.2,0,Math.PI*2);ctx.fill();
    }
    label('PROFMONKEY · CRITICAL POINT',46,45,412,50,'#ffffff18','#e8e2ff',19);
    text('临界点',48,154,89,'#ffffff',1000);
    text('一击引爆全场',50,223,28,colors[3],850);
    text('HIGH SCORE  /  高能战绩',50,293,21,'#c8bddc',750);
    const scoreText=Number(data.score||0).toLocaleString('zh-CN');
    text(scoreText,46,369,88,'#ffffff',1000);
    text('PTS',W-54,366,27,colors[3],950,'right');
    ctx.fillStyle='#ffffff14';rounded(42,429,636,136,22);ctx.fill();
    const vals=[['最长连锁',`${data.chain} 层`],['累计爆炸',`${data.explosions} 次`],['临界数字',`${data.threshold}`]];
    vals.forEach(([key,val],i)=>{const x=151+i*209;text(key,x,465,20,'#bfb6d8',600,'center');text(val,x,520,36,'#fff',950,'center');});
    text('FINAL BOARD  /  最终棋盘',48,615,22,colors[3],900);
    const N=6,gap=7,size=65,left=(W-(N*size+(N-1)*gap))/2,top=662;
    ctx.fillStyle='#ffffff0c';rounded(left-13,top-13,N*size+(N-1)*gap+26,N*size+(N-1)*gap+26,23);ctx.fill();
    // 棋盘缩略图刻意压到海报中部，留出底部战绩和传播文案。
    const small=size,g=gap;const x0=(W-(N*small+(N-1)*g))/2;
    const y0=top;
    for(let i=0;i<N*N;i++){
      const x=x0+(i%N)*(small+g),y=y0+Math.floor(i/N)*(small+g);
      const t=data.types?.[i]||0,val=Math.max(0,Math.min(5,Number(data.board?.[i])||0));
      ctx.fillStyle=t===3?'#20212a':tileColors[val];rounded(x,y,small,small,11);ctx.fill();
      if(t===1||t===4||t===5){ctx.strokeStyle=colors[4];ctx.lineWidth=3;ctx.stroke();}
      if(t===2){ctx.strokeStyle='#f6cf69';ctx.lineWidth=3;ctx.stroke();}
      text(t===3?'▦':val?val:'·',x+small/2,y+small/2,32,val?'#ffffff':'#7e88a9',900,'center');
      if(t===1||t===4||t===5){text(t===1?'×2':t===4?'✕':'HP',x+small-7,y+9,13,'#fff2ab',800,'right');}
    }
    const endY=H-178;
    ctx.fillStyle='#ffffff19';rounded(44,endY,632,119,22);ctx.fill();
    label(data.goal||'高分挑战',64,endY+15,185,37,colors[2]+'44','#ffffff',19);
    text(data.modeName||'经典模式',W-65,endY+36,26,'#ffffff',850,'right');
    text('你的下一次点击，可能引爆整个棋盘。',64,endY+89,21,'#e0d7f4',700);
    text('github.com/ProfMonkey/critical-point',47,H-26,18,'#af9fc8',650);
    text(data.date||'',W-47,H-26,18,'#af9fc8',650,'right');
  }
  function open(data){
    render(data);
    $('posterBackdrop').classList.add('visible');
    $('posterHint').textContent='海报只在本机生成，不上传任何战绩。';
    $('posterClose').focus({preventScroll:true});
  }
  function close(){ $('posterBackdrop').classList.remove('visible'); }
  function toBlob(){return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}
  function fileName(){return `临界点_战绩_${record?.date||'today'}_${record?.score||0}.png`;}
  async function download(){
    if(!record)return;
    const blob=await toBlob();if(!blob){$('posterHint').textContent='当前浏览器无法生成 PNG，请截图保存。';return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.download=fileName();a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    $('posterHint').textContent='图片已生成；如果手机浏览器没有自动保存，请长按海报截图保存。';
  }
  async function share(){
    if(!record)return;
    const blob=await toBlob();if(!blob){return download();}
    const file=new File([blob],fileName(),{type:'image/png'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({title:'临界点 · ProfMonkey',text:`我在《临界点》拿了 ${record.score} 分！来挑战我！`,files:[file]});return;}
      catch(e){if(e?.name==='AbortError')return;}
    }
    await download();
    $('posterHint').textContent='当前浏览器不支持直接分享图片，已尝试保存 PNG，可从相册或下载目录转发。';
  }
  $('posterClose').addEventListener('click',close);
  $('posterDownload').addEventListener('click',()=>void download());
  $('posterShare').addEventListener('click',()=>void share());
  $('posterBackdrop').addEventListener('click',e=>{if(e.target===$('posterBackdrop'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('posterBackdrop').classList.contains('visible'))close();});
  window.CriticalPoster={open,close,render};
})();