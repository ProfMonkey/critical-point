/* 临界点 v0.9 — 新机制逐条自动演示，新增斜向爆炸教学；教学不修改真实对局。 */
(() => {
  'use strict';
  const E = window.CriticalEngine, C = window.CriticalCampaign;
  const SIZE = E.SIZE, CENTER = 14, $ = id => document.getElementById(id);
  const KEY = 'profmonkey-critical-v07-tutorial-', seenNow = new Set();
  const DATA = {
    quests: {icon:'📋',title:'每日任务 · 完成就领奖',lead:'每天有三项小挑战：完成 2 局、打出 3 层连锁、单局达到 500 分。',end:'对局结束后会自动记录进度；任务亮起完成状态后，打开「每日任务」点击领取即可获得晶核。每天刷新，已领取奖励不会重复发放。',meter:'📋 3 项任务 · 每项 +1 晶核'},
    base: {icon:'💥',title:'点满就会炸',lead:'点一下 +1，达到 4 就爆炸，向四周传递能量。',end:'看到没有？数字达到临界值就爆炸，周围的格子各得到 1 点能量。',meter:'💥 临界值：4'},
    campaign: {icon:'🗺️',title:'关卡 · 达标还可以继续',lead:'完成目标就能过关；剩余步数可以继续冲高分和三星。',end:'目标完成后不会立刻结束。你可以继续挑战星级，也可以自己结算。',meter:'🏁 演示目标：20 分'},
    chain: {icon:'⚡',title:'连锁反应',lead:'一次爆炸点燃相邻的数字 3，接连爆炸！',end:'重点不是连点，而是提前布置：一次点击，触发多层连爆。',meter:'⚡ 连锁层数'},
    goalChain: {icon:'⚡',title:'新任务：最长连锁',lead:'这次不只看分数，要让一次点击引爆多层！',end:'计数是「一次操作里最深的连锁层数」，不是整局点击多少次。',meter:'🎯 演示目标：3 层'},
    goalExplosions: {icon:'💣',title:'新任务：累计爆炸数',lead:'每次爆炸的格子都算 1 次，整局累计起来！',end:'一个格子爆炸算 1 次；一回合炸 3 个就累计 +3。之后继续累加。',meter:'🎯 演示目标：3 次爆炸'},
    diagonalMix: {icon:'👾',title:'终极战术：折射金色目标',lead:'先用紫色 ✕ 格绕过石墙，再让斜向能量引爆金色目标。',end:'斜爆格传四个对角；石墙不接收能量；金色目标真正爆炸才计数。',meter:'👾 折射 + 石墙 + 金色目标'},
    diagonal: {icon:'🟣',title:'新机制：斜向爆炸',lead:'紫色 ✕ 格：数字照常 +1，但爆炸时改成传给四个斜角。',end:'普通格爆炸传上下左右，紫色 ✕ 格爆炸传四个斜角。点击动作仍是 +1。',meter:'🟣 紫色 ✕ 格：向四个对角传播'},
    boost: {icon:'🔷',title:'×2 放大格',lead:'带蓝色 ×2 标记的格子，点击一次数字直接 +2。',end:'只有主动点击放大格才 +2。爆炸传播到这里仍然只 +1。',meter:'🔷 点击一次 +2'},
    rock: {icon:'🧱',title:'石墙挡路',lead:'灰色石墙不能点击，也不会接收相邻爆炸的能量。',end:'看右边的石墙：爆炸过后依然不动。能量不能穿过石墙。',meter:'🧱 无法点击 · 不接能量'},
    target: {icon:'🎯',title:'金色目标',lead:'有金色边框的格子必须真正爆炸，才能计入目标。',end:'金框发生爆炸后变成 ✓。仅仅点击一下、让数字变大不算完成。',meter:'🎯 目标：0 / 1'},
    cross: {icon:'🌟',title:'组合技：放大格 → 目标',lead:'蓝色 ×2 可以帮你引爆旁边的金色目标。',end:'你已经学过两种格子，现在把它们连起来用：×2 起爆，金框收尾。',meter:'🌟 连锁组合技'},
    five: {icon:'🔢',title:'数字 4 解锁',lead:'出现数字 4！这次要达到 5 才会爆炸。',end:'同样的点击方式，只是临界值提高到 5。数字 4 还不会爆。',meter:'🔢 临界值：5'},
    six: {icon:'🌋',title:'数字 5 解锁',lead:'出现数字 5！这次要达到 6 才会爆炸。',end:'别看到数字 4 就以为要爆了：本关要凑到 6。',meter:'🔢 临界值：6'},
    mixed: {icon:'👑',title:'终极关：多种机制一起上',lead:'放大格、金框、石墙、新数字会同时出现。',end:'先用 ×2 起爆，让金框被连锁击中；石墙阻挡能量，临界值仍是 5。',meter:'👑 新组合 · 临界值 5'},
    boss: {icon:'👾',title:'Boss战：点亮核心，击穿护盾',lead:'红紫色 Boss 核心点击一次 +2；核心爆炸后，Boss 失去 1 格生命。每次玩家点击最多造成 1 点伤害。',end:'Boss核心主动点击 +2，受到周围传能仍只 +1。核心爆炸会削减 Boss 1 点生命；一回合无论连爆几层，最多扣 1 HP。',meter:'👾 Boss生命：3 / 3'},
    frenzy: {icon:'🔥',title:'狂热模式：连爆续命',lead:'一击打出至少 3 层连锁，就获得额外 +1 步。',end:'刚才用掉 1 步，又因为 3 层连锁奖励了 1 步！每局最多获得 3 次。',meter:'🔥 剩余点击：10'},
    daily: {icon:'📅',title:'每日挑战：同日同盘',lead:'同一天反复开局，初始棋盘都一样。',end:'同一天重新开始，出现的还是同一张棋盘。明天会换新布局。',meter:'📅 今日棋盘 · 第一次进入'},
    blitz: {icon:'⏱️',title:'极速模式：75 秒',lead:'第一下点击才开始倒计时，75 秒内点击次数不限。',end:'看倒计时：从第一次点击开始，不扣点击步数，只有时间限制。',meter:'⏱️ 剩余：75 秒'},
    overload: {icon:'🚀',title:'超载：数字达到 6 才爆',lead:'舒适版 20 步高能开局；挑战版 16 步普通开局。',end:'这盘要凑到 6 才爆炸；推荐先用「舒适」练习。切换难度会换一张棋盘。',meter:'✨ 舒适：20 步 / 🔥 挑战：16 步'},
    overloadHard: {icon:'🔥',title:'挑战难度：步数更少',lead:'从舒适版 20 步切换到 16 步，初始数字也更分散。',end:'不是新数字规则，只是更严格的挑战。第一次尝试建议别追求完美。',meter:'🔥 挑战难度：16 步'}
  };
  const cells = [], BOARD = $('tutorialBoard');
  let queue = [], index = 0, current = null, automatic = false, playing = false,
      run = 0, wait = null, wake = null, nextFocus = null, activeScope = '';
  const wasSeen = id => {if(seenNow.has(id))return true;try{return localStorage.getItem(KEY+id)==='1';}catch{return false;}};
  const record = id => {seenNow.add(id);try{localStorage.setItem(KEY+id,'1');}catch{}};
  function cancel() {run++;clearTimeout(wait);wait=null;if(wake){const r=wake;wake=null;r();}playing=false;}
  function sleep(ms) {return new Promise(resolve=>{wake=resolve;wait=setTimeout(()=>{wait=null;wake=null;resolve();},ms);});}
  const isOpen = () => $('tutorialBackdrop').classList.contains('visible');
  const still = nonce => nonce === run && isOpen();
  function setStatus(a,b){$('tutorialStatus').textContent=a;$('tutorialDetail').textContent=b;}
  function say(s){$('tutorialOutcome').textContent=s;}
  function meter(text,hot=false){const el=$('tutorialMeter');el.textContent=text;el.classList.toggle('pulse',hot);}
  function dots(count,at) {$('tutorialDots').replaceChildren(...Array.from({length:Math.max(1,count)},(_,i)=>{const dot=document.createElement('i');dot.classList.toggle('on',i<=at);return dot;}));}
  function draw(values,options,selected=[],targets=[],click=false) {
    const blown = new Set(selected), hit = new Set(targets);
    values.forEach((n,i)=>{
      const c=cells[i],t=options.types[i];
      c.dataset.v=t===E.TYPES.ROCK?'rock':String(n);
      c.dataset.type=t===E.TYPES.ROCK?'rock':t===E.TYPES.AMPLIFIER?'boost':t===E.TYPES.TARGET?'target':t===E.TYPES.DIAGONAL?'diagonal':t===E.TYPES.BOSS?'boss':'normal';
      c.dataset.mark=t===E.TYPES.AMPLIFIER?'×2':t===E.TYPES.TARGET?(hit.has(i)?'✓':'◎'):t===E.TYPES.DIAGONAL?'✕':t===E.TYPES.BOSS?'HP':'';
      c.textContent=t===E.TYPES.ROCK?'▦':n===0?'·':String(n);
      c.classList.toggle('demo-click',click&&i===CENTER);
      c.classList.toggle('demo-explode',blown.has(i));
      c.classList.toggle('demo-cleared',hit.has(i));
    });
  }
  // 演示棋盘是单独的 6x6 沙盒；真实游戏棋盘、步数、分数完全不受影响。
  function scenario(id){
    const board=Array(36).fill(0),types=Array(36).fill(E.TYPES.NORMAL);
    let threshold=4;board[CENTER]=3;
    if(['chain','goalChain','goalExplosions','frenzy'].includes(id)){board[13]=3;board[7]=3;}
    if(id==='campaign'){board[13]=3;}
    if(id==='boost'){board[CENTER]=2;types[CENTER]=E.TYPES.AMPLIFIER;}
    if(id==='rock'){types[15]=E.TYPES.ROCK;board[15]=-1;board[13]=2;}
    if(id==='diagonal'){types[CENTER]=E.TYPES.DIAGONAL;board[7]=3;board[9]=2;board[19]=2;board[21]=2;}
    if(id==='diagonalMix'){types[CENTER]=E.TYPES.DIAGONAL;board[7]=3;types[7]=E.TYPES.TARGET;board[9]=-1;types[9]=E.TYPES.ROCK;board[19]=2;board[21]=3;}
    if(['target','cross'].includes(id)){types[13]=E.TYPES.TARGET;board[13]=3;if(id==='cross'){types[CENTER]=E.TYPES.AMPLIFIER;board[CENTER]=2;}}
    if(id==='five'){threshold=5;board[CENTER]=4;}
    if(['six','overload','overloadHard'].includes(id)){threshold=6;board[CENTER]=5;}
    if(id==='mixed'){threshold=5;types[CENTER]=E.TYPES.AMPLIFIER;board[CENTER]=3;board[13]=4;types[13]=E.TYPES.TARGET;board[15]=-1;types[15]=E.TYPES.ROCK;}
    if(id==='boss'){board[CENTER]=2;types[CENTER]=E.TYPES.BOSS;for(const i of [13,15,20])board[i]=3;}
    if(id==='daily'){const fixed=E.boardFromSeed(20261025);board.splice(0,36,...fixed);board[CENTER]=3;}
    const options={threshold,types};
    return {board,options,result:E.applyMove(board,CENTER,options)};
  }
  function planFor(mode,level=null,difficulty='easy',includeSeen=false){
    const ids=[];const add=id=>{if(DATA[id]&&!ids.includes(id)&&(includeSeen||!wasSeen(id)))ids.push(id);};
    add('base');
    add('quests');
    if(mode==='campaign'){
      add('campaign');
      // 不再依赖固定关卡编号：只要这一关实际含有新机制，就在开始前解释。
      if(level){
        if(level.goal==='chain'){add('chain');add('goalChain');}
        if(level.goal==='explosions')add('goalExplosions');
        if(level?.specials?.a?.length) add('boost');
        if(level?.specials?.b?.length) add('boss');
        if(level?.specials?.d?.length) add('diagonal');
        if(level?.specials?.r?.length) add('rock');
        if(level?.specials?.t?.length) add('target');
        if(level?.specials?.a?.length && level?.specials?.t?.length)add('cross');
        if(level.threshold===5)add('five');
        if(level.threshold===6)add('six');
        if(level?.specials?.a?.length && level?.specials?.r?.length && level?.specials?.t?.length)add('mixed');
        if(level?.specials?.d?.length && level?.specials?.r?.length && level?.specials?.t?.length)add('diagonalMix');
        if(level?.boss)add('boss');
      }
    }
    if(mode==='frenzy'){add('chain');add('frenzy');}
    if(mode==='daily')add('daily');
    if(mode==='blitz')add('blitz');
    if(mode==='overload'){
      add('overload');
      if(difficulty==='hard')add('overloadHard');
    }
    return ids;
  }
  function setPlayButton(){const b=$('tutorialStart');b.disabled=playing;b.textContent=playing?'▶ 演示播放中…': index<queue.length-1?'下一条规则 →':'✓ 明白了，开始玩';}
  function showAt(i){
    cancel();index=i;current=queue[i];if(!current){close();return;}
    const d=DATA[current];$('tutorialIcon').textContent=d.icon;$('tutorialTitle').textContent=d.title;$('tutorialLead').textContent=d.lead;
    $('tutorialSequence').textContent=`本次新规则 ${index+1}/${queue.length}`;
    $('tutorialAutoplay').textContent=automatic?'新机制出现 · 开局前演示':'规则演示 · 随时重播';
    meter(d.meter);$('tutorialStart').textContent='▶ 演示播放中…';$('tutorialStart').disabled=true;
    void play();
  }
  async function play(){
    if(!current)return;
    cancel();playing=true;setPlayButton();
    const nonce=run,{board,options,result}=scenario(current);
    const extra = current==='daily'?2:current==='blitz'||current==='frenzy'?1:0;
    const total=result.waves.length+3+extra;
    let step=0;const advance=()=>dots(total,++step);
    dots(total,0);draw(board,options);meter(DATA[current].meter);
    setStatus('01 / 开始前','看中间发光的格子');say('先看棋盘，再看一次点击会发生什么。');
    await sleep(650);if(!still(nonce))return;
    if(current==='daily'){
      advance();setStatus('02 / 重新开局','棋盘重新生成');meter('📅 今日棋盘 · 再来一次');say('今天再玩一局，开局数字不会随机变化。');
      draw(Array(36).fill(0),options);
      await sleep(550);if(!still(nonce))return;
      advance();draw(board,options);say('看！又是完全相同的数字分布。');
      await sleep(850);if(!still(nonce))return;
    }
    advance();draw(result.initial,options,[],[],true);
    setStatus('02 / 点击','中间的数字变化了');
    say(options.types[CENTER]===E.TYPES.AMPLIFIER?'⚡ 蓝框点击 +2！':`⚡ 点击一次 +1，达到 ${options.threshold} 才爆炸。`);
    if(current==='blitz')meter('⏱️ 首次点击 → 开始 75 秒');
    if(current==='frenzy')meter('🔥 剩余点击：9');
    if(current==='overloadHard')meter('🔥 挑战：从 16 步减到 15 步');
    await sleep(680);if(!still(nonce))return;
    const hits=[];let explosions=0,points=0,bossDamageShown=false;
    for(const w of result.waves){
      advance();for(const i of w.cells)if(options.types[i]===E.TYPES.TARGET&&!hits.includes(i))hits.push(i);
      explosions+=w.cells.length;points+=w.points;
      draw(w.board,options,w.cells,hits);
      setStatus(`WAVE ${w.depth} / 爆炸`,`+${w.points} 分`);
      say(current==='diagonal' && w.depth===1?'🟣 看四个斜角！中心紫色 ✕ 爆炸，直接传给左上、右上、左下、右下。':w.depth===1?'💥 爆炸！普通格向上下左右各传 +1。':`🔥 连锁第 ${w.depth} 层！相邻格子再次爆炸。`);
      if(current==='campaign')meter(`🏁 得分 ${points}/20 · ${points>=20?'目标已达成 ✓':'努力中'}`,points>=20);
      if(current==='goalChain')meter(`⚡ 最长连锁：${w.depth}/3 层`,w.depth>=3);
      if(current==='goalExplosions')meter(`💣 已爆炸：${explosions}/3 次`,explosions>=3);
      if(current==='target')meter(`🎯 目标：${hits.length}/1 ${hits.length?'✓':''}`,hits.length>0);
      if(current==='cross'||current==='mixed')meter(`🎯 金色目标：${hits.length}/1 ${hits.length?'✓':''}`,hits.length>0);
      if(current==='diagonalMix')meter(`🟣 折射命中金框：${hits.length}/1 ${hits.length?'✓':''}`,hits.length>0);
      if(current==='boss' && w.cells.some(i=>options.types[i]===E.TYPES.BOSS) && !bossDamageShown){bossDamageShown=true;meter('👾 Boss生命：2 / 3',true);say('💥 Boss核心爆炸！这一整次点击造成 1 点伤害。');}
      await sleep(760);if(!still(nonce))return;
    }
    if(current==='quests'){
      advance();setStatus('MISSION / 任务进度','自动保存到本机');meter('📋 完成 2 局 · 3 层连锁 · 500 分');say('每局结束后自动更新任务进度，不用手动登记。');
      await sleep(680);if(!still(nonce))return;
      advance();setStatus('REWARD / 领取奖励','任务完成后可领取');meter('💎 领取 +1 晶核',true);say('点「每日任务」查看进度，完成后主动领取晶核；同一项每天只能领取一次。');
      await sleep(800);if(!still(nonce))return;
    }
    if(current==='frenzy'){
      advance();meter('🔥 三层连锁！额外 +1 步 → 10',true);setStatus('BONUS / 续命成功','奖励点击 +1');
      say('原本用掉一步，因为达成 3 层连锁，又奖励回来 1 步！');
      await sleep(740);if(!still(nonce))return;
    }
    if(current==='blitz'){
      advance();meter('⏱️ 倒计时进行中：74 秒',true);setStatus('CLOCK / 倒计时开始','点击次数不限');
      say('倒计时只会在首次点击后启动。演示里时间不会影响真实对局。');
      await sleep(740);if(!still(nonce))return;
    }
    draw(result.board,options,[],hits);dots(total,total-1);
    setStatus('演示完成 · 准备上场',`${result.depth} 层连锁 / ${result.points} 分`);
    say('✅ '+DATA[current].end);
    record(current);
    if(current==='overload')record('six'); // 已完整展示「数字 5 达到 6 才爆炸」，无需重复播第二遍。
    playing=false;setPlayButton();
    if(automatic&&index<queue.length-1){await sleep(1150);if(!still(nonce))return;showAt(index+1);}
  }
  function launch(ids,auto=false){
    if(!ids?.length)return;
    cancel();queue=ids.slice();automatic=auto;nextFocus=document.activeElement;
    $('tutorialBackdrop').classList.add('visible');showAt(0);
  }
  function close(){
    cancel();$('tutorialBackdrop').classList.remove('visible');current=null;queue=[];index=0;
    if(nextFocus?.isConnected && !nextFocus.closest('.backdrop:not(.visible)'))nextFocus.focus({preventScroll:true});
    else $('help').focus({preventScroll:true});
  }
  function onEnter(mode,level=null,difficulty='easy'){
    const context=mode+':'+(level?.id||0)+':'+difficulty;
    activeScope=context;
    const ids=planFor(mode,level,difficulty);
    if(ids.length)launch(ids,true);
  }
  for(let i=0;i<SIZE*SIZE;i++){
    const el=document.createElement('div');el.className='demo-cell';el.setAttribute('aria-hidden','true');cells.push(el);BOARD.append(el);
  }
  $('tutorialStart').addEventListener('click',()=>{
    if(playing)return;
    if(index<queue.length-1)showAt(index+1);
    else close();
  });
  $('tutorialReplay').addEventListener('click',()=>void play());
  $('tutorialBackdrop').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!playing){if(index<queue.length-1)showAt(index+1);else close();}}});
  document.querySelectorAll('[data-demo]').forEach(btn=>btn.addEventListener('click',()=>{
    $('rulesBackdrop').classList.remove('visible');launch([btn.dataset.demo],false);
  }));
  window.CriticalTutorial={onEnter,open:id=>launch([id],false),close,planFor,scenario,wasSeen,DATA};
  // game.js 初始化时脚本尚未载入：首屏的教学立即补发，绝不等真实点击。
  onEnter('classic');
})();