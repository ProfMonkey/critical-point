/* 临界点 v1.2 | ProfMonkey — 斜向新章、波纹传导、逐条演示。No dependencies. */
(() => {
'use strict';
const engine = window.CriticalEngine;
const { SIZE, boardFromSeed, applyMove } = engine;
const campaign = window.CriticalCampaign;
const $ = id => document.getElementById(id);
const tiles = [], boardEl = $('board'), card = $('boardCard');
const configs = {
  classic: { name: '经典', moves: 12, desc: '12 次点击，尽可能打出高分', chip: '自由挑战' },
  frenzy: { name: '狂热', moves: 10, desc: '单次连锁达到 3 层，加 1 步（最多 3 次）', chip: '连锁续命' },
  daily: { name: '每日', moves: 12, desc: '当天固定同一初始棋盘，比拼得分', chip: '每日同盘' },
  campaign: { name: '闯关', moves: 6, desc: '29 关逐渐变难；Boss 核心会显示生命条', chip: '29 关挑战' },
  overload: { name: '超载', moves: 20, desc: '默认舒适：20 步、高能开局；可切换 16 步挑战', chip: '可选难度' },
  blitz: { name: '极速', moves: 999, seconds: 75, desc: '首次点击后开始计时，75 秒内尽情引爆', chip: '75 秒挑战' }
};
const BADGES = [
  { id:'spark', icon:'💥', name:'第一声', note:'任意模式完成一次爆炸' },
  { id:'combo3', icon:'⚡', name:'连锁大师 I', note:'单次操作达到 3 层连锁' },
  { id:'combo6', icon:'🌩️', name:'连锁大师 II', note:'单次操作达到 6 层连锁' },
  { id:'combo10', icon:'☄️', name:'惊天动地', note:'单次操作达到 10 层连锁' },
  { id:'mass', icon:'💣', name:'一键清场', note:'单次操作引发至少 10 次爆炸' },
  { id:'score500', icon:'🏆', name:'高能玩家', note:'单局累计至少 500 分' },
  { id:'daily', icon:'📅', name:'每日打卡', note:'完成一局每日挑战' },
  { id:'final', icon:'👑', name:'极限突破', note:'通关第 8 关' },
  { id:'reactor', icon:'🌋', name:'终极反应堆', note:'通关第 20 关' },
  { id:'diagonal', icon:'🟣', name:'转角大师', note:'在斜爆格上触发一次爆炸' },
  { id:'diagonalFinal', icon:'👾', name:'紫电征服者', note:'通关第 26 关' },
  { id:'boost', icon:'🔷', name:'超能接力', note:'使用放大格引发爆炸' },
  { id:'target', icon:'🎯', name:'精准打击', note:'成功引爆一枚金色目标' },
  { id:'overload', icon:'🔢', name:'数字新境界', note:'在临界值 6 的对局中引发爆炸' },
  { id:'blitz', icon:'⏱️', name:'闪电出击', note:'完成一局极速模式' },
  { id:'bossFirst', icon:'👾', name:'首领破坏者', note:'首次击败一个 Boss' },
  { id:'bossFinal', icon:'👑', name:'紫电终结者', note:'击败最终 Boss「紫电之王」' }
];
let mode = 'classic', levelIndex = 0, seed = 1, board = [], movesLeft = 12, score = 0, bossDamage = 0,
    savedBest = 0, explosions = 0, maxChain = 0, bonusEarned = 0, singleBangMax = 0,
    busy = false, token = 0, undoState = null, undoUsed = false, hintUsed = false,
    ended = false, levelWon = false, soundOn = false, audio = null, toastTimer = 0,
    types = Array(36).fill(0), threshold = 4, hitTargets = new Set(), diagonalOnce = false,
    boostedOnce = false, timeLeft = 75, timeStartedAt = 0, countdown = null,
    overloadDifficulty = (() => {try{return localStorage.getItem('profmonkey-critical-v06-overload') === 'hard'?'hard':'easy';}catch{return 'easy';}})(),
    bossRewardThisFinish = 0,
    equippedSkin = (() => {try{return localStorage.getItem('profmonkey-critical-v09-skin') || 'neon';}catch{return 'neon';}})(),
    vibrationOn = (()=>{try{return localStorage.getItem('profmonkey-critical-v08-vibration')==='on';}catch{return false;}})();
const level = () => campaign.LEVELS[levelIndex];
const CRYSTAL_KEY = 'profmonkey-critical-v09-crystals';
const SKIN_UNLOCK_PREFIX = 'profmonkey-critical-v09-skin-unlocked-';
const SKINS = [
  {id:'neon',name:'紫电霓虹',price:0,icon:'🟣',desc:'经典紫粉霓虹 · 默认拥有'},
  {id:'solar',name:'熔金日蚀',price:2,icon:'🌞',desc:'熔岩橙金 · 首领战奖励可解锁'},
  {id:'cyber',name:'赛博青焰',price:3,icon:'🧬',desc:'电光青绿 · 冷色能量风格'},
  {id:'gold',name:'王者金焰',price:5,icon:'👑',desc:'黑金终极主题 · Boss收藏款'}
];
let forecastOn = false, forecastSelection = null, replayFrame = null;
const PACE_KEY = 'profmonkey-critical-v12-pace';
let fastPace = (()=>{try{return localStorage.getItem(PACE_KEY)!=='classic';}catch{return true;}})();
const reducedMotion=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const waveDelay=(ms)=>reducedMotion()?Math.min(28,ms):Math.round(ms*(fastPace?.66:1));
function syncPace(){
  const button=$('pace');button.textContent=fastPace?'⚡ 爽快节奏':'🎞 经典节奏';
  button.setAttribute('aria-pressed',String(fastPace));
  document.body.classList.toggle('fast-pace',fastPace);
}

const DAILY_QUEST_KEY = 'profmonkey-critical-v10-daily-quests';
const PROFILE_KEY = 'profmonkey-critical-v10-player-profile';
const DAILY_QUESTS = [
  {id:'rounds',icon:'🎮',name:'热身开炸',desc:'完成任意模式的 2 局对战。',target:2,reward:1,progress:s=>Math.min(2,s.rounds),done:s=>s.rounds>=2},
  {id:'chain',icon:'⚡',name:'连锁试炼',desc:'在任意一局中，打出至少 3 层连锁。',target:1,reward:1,progress:s=>s.bestChain>=3?1:0,done:s=>s.bestChain>=3},
  {id:'score',icon:'🏆',name:'高能输出',desc:'单局得分达到 500 分。',target:1,reward:1,progress:s=>s.bestScore>=500?1:0,done:s=>s.bestScore>=500}
];
function hasSkin(id){return id==='neon'||readNumber(SKIN_UNLOCK_PREFIX+id)>0;}
function applySkin(){if(!SKINS.some(x=>x.id===equippedSkin)||!hasSkin(equippedSkin))equippedSkin='neon';document.body.dataset.skin=equippedSkin;try{localStorage.setItem('profmonkey-critical-v09-skin',equippedSkin);}catch{}}
function crystalBalance(){return readNumber(CRYSTAL_KEY);}
function renderShop(){
  $('shopBalance').textContent=crystalBalance().toString();$('shopGrid').replaceChildren();
  for(const skin of SKINS){
    const unlocked=hasSkin(skin.id),equipped=equippedSkin===skin.id;
    const item=document.createElement('article');item.className='skin-card'+(equipped?' equipped':'')+(!unlocked?' locked':'');
    const swatch=document.createElement('div');swatch.className='skin-swatch skin-'+skin.id;swatch.textContent=skin.icon;
    const title=document.createElement('strong');title.textContent=skin.name;
    const desc=document.createElement('small');desc.textContent=skin.desc;
    const action=document.createElement('button');action.type='button';action.className='action'+(equipped?' primary':'');
    action.textContent=equipped?'✓ 已装备':unlocked?'装备主题':`💎 ${skin.price} · 解锁`;
    action.disabled=equipped||(!unlocked&&crystalBalance()<skin.price);
    action.addEventListener('click',()=>{
      if(!hasSkin(skin.id)){
        if(crystalBalance()<skin.price){toast('晶核不足，去挑战 Boss 获得奖励');return;}
        writeNumber(CRYSTAL_KEY,crystalBalance()-skin.price);writeNumber(SKIN_UNLOCK_PREFIX+skin.id,1);toast(`已解锁「${skin.name}」！`);
      }
      equippedSkin=skin.id;applySkin();updateUI();renderShop();
    });
    item.append(swatch,title,desc,action);$('shopGrid').append(item);
  }
}
function openShop(){renderShop();$('shopBackdrop').classList.add('visible');}
function readNumber(key) { try { return Math.max(0, Number(localStorage.getItem(key)) || 0); } catch { return 0; } }
function writeNumber(key, val) { try { localStorage.setItem(key, String(val)); } catch {} }
function readDailyQuests(){
  try{
    const raw=localStorage.getItem(DAILY_QUEST_KEY), saved=raw?JSON.parse(raw):null;
    if(saved&&saved.date===localDate())return {date:saved.date,rounds:Math.max(0,saved.rounds|0),bestChain:Math.max(0,saved.bestChain|0),bestScore:Math.max(0,saved.bestScore|0),claimed:Array.isArray(saved.claimed)?saved.claimed.filter(id=>DAILY_QUESTS.some(q=>q.id===id)):[]};
  }catch{}
  return {date:localDate(),rounds:0,bestChain:0,bestScore:0,claimed:[]};
}
function saveDailyQuests(state){try{localStorage.setItem(DAILY_QUEST_KEY,JSON.stringify(state));}catch{}}
function readProfile(){
  const empty={rounds:0,totalScore:0,totalExplosions:0,bestChain:0,bestScore:0,bossWins:0,history:[]};
  try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(p&&typeof p==='object')return {...empty,...p,history:Array.isArray(p.history)?p.history.slice(0,8):[]};}catch{}
  return empty;
}
function saveProfile(profile){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{}}
function questValue(quest,state){return Math.min(quest.target,Math.max(0,Number(quest.progress(state))||0));}
function renderQuestCount(){
  const state=readDailyQuests();
  const complete=DAILY_QUESTS.filter(q=>q.done(state)).length;
  $('questCount').textContent=`${complete}/3`;
}
function renderDailyQuests(){
  const state=readDailyQuests(),list=$('questList');
  $('questIntro').textContent=`${state.date} · 完成任务领取晶核，进度保存在当前设备。`;
  $('questReset').textContent=`📅 今日任务 · 已领取 ${state.claimed.length}/3 · 每项奖励 1 晶核`;
  list.replaceChildren();
  for(const q of DAILY_QUESTS){
    const value=questValue(q,state),done=q.done(state),claimed=state.claimed.includes(q.id);
    const cardEl=document.createElement('article');cardEl.className='quest-card'+(done?' complete':'')+(claimed?' claimed':'');
    const head=document.createElement('div');head.className='quest-head';
    const icon=document.createElement('span');icon.className='quest-icon';icon.textContent=q.icon;
    const copy=document.createElement('div');copy.className='quest-copy';
    const title=document.createElement('strong');title.textContent=q.name;
    const desc=document.createElement('small');desc.textContent=q.desc;
    copy.append(title,desc);
    const reward=document.createElement('span');reward.className='quest-reward';reward.textContent=`💎 +${q.reward}`;
    head.append(icon,copy,reward);
    const row=document.createElement('div');row.className='quest-progress-row';
    const progressLabel=document.createElement('span');progressLabel.textContent=claimed?'已领取奖励':done?'任务完成！': '任务进度';
    const numbers=document.createElement('b');numbers.textContent=`${value}/${q.target}`;row.append(progressLabel,numbers);
    const track=document.createElement('div');track.className='quest-progress-track';
    const fill=document.createElement('div');fill.className='quest-progress-fill';fill.style.width=`${100*value/q.target}%`;track.append(fill);
    const button=document.createElement('button');button.type='button';button.className='action'+(done&&!claimed?' primary':'');button.disabled=!done||claimed;
    button.textContent=claimed?'✓ 已领取':done?`领取奖励 · +${q.reward} 💎`:'继续挑战';
    button.addEventListener('click',()=>claimDailyQuest(q.id));
    cardEl.append(head,row,track,button);list.append(cardEl);
  }
  renderQuestCount();
}
function claimDailyQuest(id){
  const q=DAILY_QUESTS.find(x=>x.id===id);if(!q)return;
  const state=readDailyQuests();
  if(state.claimed.includes(id)){toast('这项任务今天已经领取过了');return;}
  if(!q.done(state)){toast('还没完成任务，继续开炸！');return;}
  state.claimed.push(id);saveDailyQuests(state);writeNumber(CRYSTAL_KEY,crystalBalance()+q.reward);
  renderDailyQuests();updateUI();toast(`任务完成！获得 ${q.reward} 枚晶核 💎`);sound(720,.18,'triangle',.05);
}
function openDailyQuests(){renderDailyQuests();$('questBackdrop').classList.add('visible');}
function renderProfile(){
  const p=readProfile(),stats=[['已完成对局',p.rounds],['累计得分',Number(p.totalScore||0).toLocaleString('zh-CN')],['累计爆炸',Number(p.totalExplosions||0).toLocaleString('zh-CN')],['最佳连锁',`${p.bestChain||0} 层`],['单局最高分',Number(p.bestScore||0).toLocaleString('zh-CN')],['Boss胜场',p.bossWins||0]];
  $('profileStats').replaceChildren(...stats.map(([label,value])=>{const item=document.createElement('div');item.className='profile-stat';const strong=document.createElement('strong');strong.textContent=String(value);const small=document.createElement('small');small.textContent=label;item.append(strong,small);return item;}));
  const history=$('historyList');history.replaceChildren();
  if(!p.history.length){const empty=document.createElement('div');empty.className='history-empty';empty.textContent='还没有完成的对局。打完第一局后，战绩会自动记录在这里。';history.append(empty);}
  for(const item of p.history){
    const row=document.createElement('div');row.className='history-item';const left=document.createElement('div');
    const title=document.createElement('strong');title.textContent=item.title||item.mode||'挑战';
    const meta=document.createElement('small');meta.textContent=`${item.date||''} · 连锁 ${item.chain||0} 层 · 爆炸 ${item.explosions||0} 次${item.won===true?' · 通关':item.won===false?' · 未通关':''}`;
    left.append(title,meta);const right=document.createElement('div');right.className='history-score';right.textContent=Number(item.score||0).toLocaleString('zh-CN');const small=document.createElement('small');small.textContent='分';right.append(small);row.append(left,right);history.append(row);
  }
}
function openPlayerProfile(){renderProfile();$('profileBackdrop').classList.add('visible');}
function recordFinishedRun(won){
  const profile=readProfile();profile.rounds=(profile.rounds||0)+1;profile.totalScore=(profile.totalScore||0)+score;profile.totalExplosions=(profile.totalExplosions||0)+explosions;
  profile.bestChain=Math.max(profile.bestChain||0,maxChain);profile.bestScore=Math.max(profile.bestScore||0,score);
  if(mode==='campaign'&&level().boss&&won)profile.bossWins=(profile.bossWins||0)+1;
  const title=mode==='campaign'?`第 ${level().id} 关 · ${level().name}`:configs[mode].name+(mode==='overload'?(overloadDifficulty==='easy'?' · 舒适':' · 挑战'):'');
  profile.history.unshift({date:localDate(),title,mode,score,chain:maxChain,explosions,won:mode==='campaign'?Boolean(won):null});profile.history=profile.history.slice(0,8);saveProfile(profile);
  const q=readDailyQuests();q.rounds++;q.bestChain=Math.max(q.bestChain,maxChain);q.bestScore=Math.max(q.bestScore,score);saveDailyQuests(q);renderQuestCount();
}
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function hashDate(date) { let h = 2166136261; for (const c of 'critical-profmonkey-' + date) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) || 1; }
function bestKey() {
  if(mode==='campaign') return `profmonkey-critical-v3-level-best-${level().id}`;
  if(mode==='overload') return `profmonkey-critical-v06-best-overload-${overloadDifficulty}`;
  return `profmonkey-critical-v2-best-${mode}${mode === 'daily' ? '-' + localDate() : ''}`;
}
function starsKey(i) { return `profmonkey-critical-v3-stars-${i+1}`; }
function badgeKey(id) { return `profmonkey-critical-v3-badge-${id}`; }
function unlockedCount() { let count = 1; for (let i = 0; i < campaign.LEVELS.length-1; i++) { if (readNumber(starsKey(i)) > 0) count++; else break; } return count; }
function randomSeed() { if (globalThis.crypto?.getRandomValues) { const x = new Uint32Array(1); crypto.getRandomValues(x); return x[0] || 1; } return (Date.now() ^ Math.floor(Math.random()*2**32)) >>> 0 || 1; }
function currentSeed(fresh) { if (mode === 'daily') return hashDate(localDate()); if (mode === 'campaign') return level().seed; return fresh ? randomSeed() : seed; }
function getOptions() {
  return mode === 'campaign' ? campaign.optionsFor(level(),engine) : {
    threshold: mode === 'overload' ? 6 : 4, types:Array(SIZE*SIZE).fill(0),
    hotStart: mode === 'overload' && overloadDifficulty === 'easy'
  };
}
function goalState() { return {score,chain:maxChain,explosions,targets:hitTargets.size,boss:bossDamage,movesLeft}; }
function goalReached() { return mode==='campaign' && campaign.currentValue(level(),goalState())>=level().target; }
function render(v) {
  v.forEach((n,i) => {
    const el=tiles[i], t=types[i], stone=t===engine.TYPES.ROCK;
    el.dataset.v=stone?'rock':String(Math.min(n,5));
    el.dataset.type=stone?'rock':t===engine.TYPES.AMPLIFIER?'boost':t===engine.TYPES.TARGET?'target':t===engine.TYPES.DIAGONAL?'diagonal':t===engine.TYPES.BOSS?'boss':'normal';
    el.dataset.mark=stone?'':t===engine.TYPES.AMPLIFIER?'×2':t===engine.TYPES.TARGET?(hitTargets.has(i)?'✓':'◎'):t===engine.TYPES.DIAGONAL?'✕':t===engine.TYPES.BOSS?'HP':'';
    el.classList.toggle('hotspot', !stone && n === threshold-1);
    el.classList.toggle('cleared',hitTargets.has(i));
    el.textContent=stone?'▦':n?String(n):'·';
    el.disabled=stone;
    el.setAttribute('aria-label',`第${Math.floor(i/SIZE)+1}行第${i%SIZE+1}列，${stone?'石墙（不可点）':(t===1?'放大格，点击加二，':t===2?'目标格，':t===4?'斜爆格，爆炸传给对角方向，':t===5?'Boss核心，点击加二，爆炸伤害Boss，':'')+'数字'+n}`);
  });
}
function updateVariant() {
  const notes=[];
  if (types.includes(engine.TYPES.AMPLIFIER)) notes.push('🔷 点 ×2：加 2');
  if (types.includes(engine.TYPES.DIAGONAL)) notes.push('🟣 ✕ 爆炸：斜向传能');
  if (types.includes(engine.TYPES.BOSS)) notes.push('👾 Boss核心：点击 +2，爆炸扣 1 HP/次点击');
  if (types.includes(engine.TYPES.ROCK)) notes.push('🧱 墙：不传能量');
  if (types.includes(engine.TYPES.TARGET)) notes.push(`🎯 已爆破 ${hitTargets.size}/${types.filter(t=>t===2).length}`);
  if (threshold !== 4) notes.push(`🔢 凑到 ${threshold} 才爆炸`);
  $('variantLine').hidden=notes.length===0;
  $('variantLine').textContent=notes.join(' · ');
  $('ruleThreshold').textContent=String(threshold);
  $('headlineThreshold').textContent=String(threshold);
  $('rulesThreshold').textContent=String(threshold);
}
function info(s, hot = false) { $('message').textContent = s; $('message').classList.toggle('hot', hot); }
function toast(s) { const el = $('toast'); el.textContent = s; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2100); }
function clearEffects() { card.querySelectorAll('.spark,.float,.combo,.energy-beam').forEach(e => e.remove()); card.classList.remove('shock','flare'); tiles.forEach(e => e.classList.remove('selected','bursting','hinted')); }
// 无副作用预测：纯引擎在副本上演算，本局数字、步数、Boss血量和任务进度均不变。
function resetForecastSelection(){
  forecastSelection=null;
  tiles.forEach(t=>t.classList.remove('forecast-selected','forecast-affected','forecast-burst'));
  const strip=$('predictionStrip');strip.hidden=!forecastOn;
  $('predictionConfirm').hidden=true;
  $('predictionTitle').textContent='🔮 预测模式已开启';
  $('predictionDetail').textContent='点击棋盘任意格预览；再按「确认引爆」才消耗步数。';
}
function turnForecastOff(){forecastOn=false;resetForecastSelection();$('forecast').setAttribute('aria-pressed','false');$('forecast').textContent='🔮 战术预览：关';}
function showForecast(i){
  if(!forecastOn || busy || ended || types[i]===engine.TYPES.ROCK)return;
  const r=applyMove(board,i,{threshold,types});
  resetForecastSelection();forecastSelection=i;
  const changed=r.waves.flatMap(w=>w.cells);
  const detonated=new Set(changed),affected=new Set([i]);
  for(const k of changed){
    affected.add(k);
    const adjacent=types[k]===engine.TYPES.DIAGONAL?engine.getDiagonalNeighbors(k):engine.getNeighbors(k);
    adjacent.forEach(nb=>{if(types[nb]!==engine.TYPES.ROCK)affected.add(nb)});
  }
  for(const k of affected) tiles[k].classList.add('forecast-affected');
  for(const k of detonated) tiles[k].classList.add('forecast-burst');
  tiles[i].classList.add('forecast-selected');
  const newTargets=r.hitTargets.filter(k=>!hitTargets.has(k)).length;
  const bossHit=mode==='campaign'&&level().boss&&r.hitBosses.length&&bossDamage<level().boss.hp?1:0;
  $('predictionTitle').textContent=`第 ${Math.floor(i/SIZE)+1} 行 · 第 ${i%SIZE+1} 列`;
  $('predictionDetail').textContent=`预计 +${r.points} 分 · ${r.depth} 层连锁 · ${r.detonations} 格爆炸${newTargets?' · 新增目标 '+newTargets:''}${bossHit?' · Boss -1 HP':''}${!r.depth?' · 继续蓄能':''}`;
  $('predictionConfirm').hidden=false;
  info('🔮 这是预测，不扣步数；点「确认引爆」才会真正落子。');
}
// 上一步高光回放只渲染旧画面，回放结束恢复真实棋盘，不重复发奖、不记录成绩。
async function replayLastMove(fromEnd=false){
  if(!replayFrame||busy||!replayFrame.waves.length)return;
  const endBackdrop=$('endBackdrop');
  const wasEnd=Boolean(fromEnd&&ended&&endBackdrop.classList.contains('visible'));
  if(document.querySelector('.backdrop.visible')&&!wasEnd)return;
  if(wasEnd)endBackdrop.classList.remove('visible');
  turnForecastOff();busy=true;boardEl.classList.add('busy');clearEffects();
  const myToken=token,record=replayFrame;
  $('replayLast').disabled=true;
  info('🎬 高光回放中（不会重复获得分数）',true);
  render(record.initial);
  await pause(waveDelay(220));
  for(const w of record.waves){
    if(myToken!==token)return;
    w.cells.forEach(i=>tiles[i].classList.add('bursting'));
    sparks(w.cells,w.depth);energyBeams(w.cells);
    await pause(waveDelay(150));
    if(myToken!==token)return;
    w.cells.forEach(i=>tiles[i].classList.remove('bursting'));
    render(w.board);
    await pause(waveDelay(140));
  }
  if(myToken!==token)return;
  render(board);busy=false;boardEl.classList.remove('busy');updateUI();
  info('✅ 回放结束，真实棋盘和分数没有变化。');
  if(wasEnd){endBackdrop.classList.add('visible');$('endReplay').focus({preventScroll:true});}
}
function updateMission() {
  const panel = $('mission');
  if (mode !== 'campaign') { panel.hidden = true; $('bossPanel').hidden=true; document.body.classList.remove('boss-mode'); return; }
  panel.hidden = false;
  const l = level(), cur = campaign.currentValue(l, {score, chain:maxChain, explosions, targets:hitTargets.size, boss:bossDamage});
  $('missionIndex').textContent = `关卡 ${l.id} / ${campaign.LEVELS.length}`;
  $('missionName').textContent = l.name;
  $('missionSub').textContent = l.sub;
  document.body.classList.toggle('boss-mode',Boolean(l.boss));
  const bossPanel=$('bossPanel');
  if(l.boss){
    bossPanel.hidden=false;$('bossIcon').textContent=l.boss.icon;$('bossName').textContent=l.boss.name;
    const hp=Math.max(0,l.boss.hp-bossDamage);$('bossHpText').textContent=`${hp} / ${l.boss.hp}`;$('bossFill').style.width=`${100*hp/l.boss.hp}%`;
    $('bossPips').replaceChildren(...Array.from({length:l.boss.hp},(_,i)=>{const pip=document.createElement('i');pip.className='boss-pip'+(i>=hp?' broken':'');return pip;}));
  }else{bossPanel.hidden=true;document.body.classList.remove('boss-mode');}
  $('missionGoal').textContent = `${campaign.goalText(l)} · ${Math.min(cur,l.target)} / ${l.target}`;
  $('goalFill').style.width = `${Math.min(100, 100*cur/l.target)}%`;
  const track=panel.querySelector('[role="progressbar"]');
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(l.target));
  track.setAttribute('aria-valuenow',String(Math.min(cur,l.target)));
  const stars = Math.max(campaign.starsFor(l,goalState()),readNumber(starsKey(levelIndex)));
  $('missionStars').textContent = '⭐'.repeat(stars)+'☆'.repeat(3-stars);
  const reached = goalReached();
  $('missionChase').textContent = reached ? `✅ 已达标！${campaign.nextStarText(l,goalState())}；可继续点击或提前结算。` : `剩余 ${movesLeft} 次点击，先完成上方目标。`;
  $('missionChase').classList.toggle('ready',reached);
  $('claimWin').hidden = !reached || ended;
  $('claimWin').disabled = busy || ended;
}
function updateUI() {
  $('moves').textContent = mode === 'blitz' ? Math.ceil(timeLeft)+'s' : movesLeft;
  $('movesLabel').textContent = mode === 'blitz' ? '剩余时间' : '剩余点击';
  $('score').textContent = score.toLocaleString('zh-CN');
  $('best').textContent = Math.max(score,savedBest).toLocaleString('zh-CN');
  $('explosions').textContent = explosions;
  $('maxChain').textContent = maxChain + ' 层';
  $('undo').disabled = mode === 'blitz' || busy || undoUsed || !undoState || ended;
  $('endUndo').disabled = undoUsed || !undoState || mode === 'campaign' || mode === 'blitz';
  $('replayLast').disabled = busy || ended || !replayFrame || !replayFrame.waves.length;
  $('endReplay').disabled = busy || !replayFrame || !replayFrame.waves.length;
  $('forecast').disabled=busy || ended || (mode==='blitz' ? timeLeft<=0 : movesLeft<1);
  $('hint').disabled = busy || hintUsed || ended || (mode === 'blitz' ? timeLeft<=0 : movesLeft === 0);
  $('hint').textContent = hintUsed ? '💡 提示已用' : '💡 提示一次';
  $('extraInfo').textContent = mode === 'frenzy' ? `🔥 额外步数 ${bonusEarned}/3` : mode === 'campaign' ? '🏁 达标后继续冲三星' : mode === 'blitz' ? '⏱️ 首次点击开始计时' : (undoUsed ? '↶ 已使用撤回' : '↶ 可撤回 1 次');
  $('overloadSettings').hidden = mode!=='overload';
  if(mode==='overload') {
    document.querySelectorAll('[data-overload-difficulty]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.overloadDifficulty===overloadDifficulty)));
    $('overloadNote').textContent=overloadDifficulty==='easy'?'高能开局，更多数字 4 / 5；20 次点击，更容易体验连续爆炸。':'普通开局，16 次点击，适合已经熟悉连锁玩法的玩家。';
  }
  $('newBoard').disabled = mode === 'daily';
  $('newBoard').textContent = mode === 'campaign' ? '🗺 选择关卡' : mode === 'daily' ? '🔒 今日固定' : '✦ 新棋盘';
  $('endNew').disabled = mode === 'daily';
  $('endNew').textContent = mode === 'campaign' ? '🗺 选择关卡' : '✦ 换盘挑战';
  $('endRestart').textContent = mode === 'campaign' ? '↻ 重试本关' : '↻ 再来一次';
  $('endNext').hidden = mode !== 'campaign' || !levelWon || levelIndex === campaign.LEVELS.length - 1;
  $('badgeCount').textContent = `${BADGES.filter(b => readNumber(badgeKey(b.id))).length}/${BADGES.length}`;
  $('crystalCount').textContent = crystalBalance().toString();
  renderQuestCount();
  updateMission();
  updateVariant();
}
function stopClock() { if(countdown)clearInterval(countdown); countdown=null; timeStartedAt=0; }
function startClock() {
  if (mode!=='blitz'||countdown||ended)return;
  timeStartedAt=Date.now(); timeLeft=configs.blitz.seconds;
  countdown=setInterval(()=>{
    if(mode!=='blitz'||ended){stopClock();return;}
    timeLeft=Math.max(0,configs.blitz.seconds-(Date.now()-timeStartedAt)/1000);
    $('moves').textContent=Math.ceil(timeLeft)+'s';
    if(timeLeft<=0){stopClock();if(!busy)finish();}
  },150);
}
function init(fresh = true) {
  stopClock(); token++; busy = false; ended = false; turnForecastOff(); replayFrame=null; levelWon = false; boardEl.classList.remove('busy'); clearEffects();
  const opts=getOptions(); types=opts.types; threshold=opts.threshold; hitTargets=new Set();boostedOnce=false;diagonalOnce=false;
  timeLeft=configs.blitz.seconds;
  seed = currentSeed(fresh); board = boardFromSeed(seed,opts);
  movesLeft = mode === 'campaign' ? level().moves : mode==='overload'?(overloadDifficulty==='easy'?20:16):configs[mode].moves;
  score = 0; bossDamage=0; bossRewardThisFinish=0; explosions = 0; maxChain = 0; bonusEarned = 0; singleBangMax = 0;
  undoUsed = false; undoState = null; hintUsed = false; savedBest = readNumber(bestKey());
  render(board); $('endBackdrop').classList.remove('visible');
  $('levelBackdrop').classList.remove('visible');
  updateUI();
  info(mode === 'campaign' ? `第 ${level().id} 关：${campaign.goalText(level())}。完成后可继续挑战三星！` : mode==='blitz'?'点第一下开始 75 秒倒计时，尽情连爆！': mode==='overload'?`超载${overloadDifficulty==='easy'?'舒适':'挑战'}局：凑到 6 爆炸，共有 ${movesLeft} 步。`:'点发光的 3，试试一击连爆！');
  window.CriticalTutorial?.onEnter(mode, mode === 'campaign' ? level() : null, overloadDifficulty);
}
function setMode(next, selectedLevelIndex = null) {
  if (!configs[next] || next === mode) return;
  mode = next;
  if (mode === 'campaign') levelIndex = selectedLevelIndex !== null ? selectedLevelIndex : Math.min(campaign.LEVELS.length-1,unlockedCount()-1);
  document.querySelectorAll('.mode').forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('active', active); b.setAttribute('aria-pressed',String(active));
  });
  $('modeInfo').textContent = configs[mode].desc;
  $('modeChip').textContent = configs[mode].chip;
  init(true);
  toast(`已切换到${configs[mode].name}模式`);
}
function chooseLevel(i) {
  if (i < 0 || i >= unlockedCount()) { toast('先通关前面的关卡才能解锁'); return; }
  levelIndex = i;
  if (mode !== 'campaign') setMode('campaign', i); else init(false);
  $('levelBackdrop').classList.remove('visible');
}
function openLevels() {
  const grid = $('levelGrid'); grid.replaceChildren();
  const count = unlockedCount();
  campaign.LEVELS.forEach((l,i) => {
    const locked = i >= count, stars = readNumber(starsKey(i));
    const btn = document.createElement('button'); btn.type = 'button';
    btn.className = 'level-tile' + (locked ? ' locked' : '') + (mode === 'campaign' && levelIndex === i ? ' active' : '');
    btn.disabled = locked;
    const upper = document.createElement('span'), name = document.createElement('b'), foot = document.createElement('small');
    upper.textContent = locked ? '🔒' : String(l.id).padStart(2,'0');
    name.textContent = locked ? '尚未解锁' : l.name;
    const special = l.boss ? '👾' : l.specials?.d ? '🟣' : l.specials?.b ? '👾' : l.specials?.t ? '🎯' : l.specials?.a ? '🔷' : l.specials?.r ? '🧱' : l.threshold ? '🔢' : '💥';
    foot.textContent = locked ? '完成前一关' : (stars ? '★'.repeat(stars) + '☆'.repeat(3-stars) : `${special} ${l.boss ? 'Boss战 · ' : ''}${l.moves} 步挑战`);
    btn.append(upper,name,foot);
    if (!locked) btn.addEventListener('click', () => chooseLevel(i));
    grid.append(btn);
  });
  $('levelIntro').textContent = `已解锁 ${count} / ${campaign.LEVELS.length} 关 · Boss首通可领取晶核，通关解锁下一关`;
  $('levelBackdrop').classList.add('visible');
}
function openBadges() {
  const grid = $('badgeGrid'); grid.replaceChildren();
  const count = BADGES.filter(b => readNumber(badgeKey(b.id))).length;
  $('badgeIntro').textContent = `已获得 ${count} / ${BADGES.length} 项 · 奖章保存在本设备浏览器`;
  BADGES.forEach(b => {
    const got = Boolean(readNumber(badgeKey(b.id)));
    const item = document.createElement('div'); item.className = 'badge-tile' + (got ? ' earned' : '');
    const icon = document.createElement('span'); icon.className = 'badge-icon'; icon.textContent = b.icon;
    const text = document.createElement('div');
    const name = document.createElement('b'); name.textContent = b.name;
    const note = document.createElement('small'); note.textContent = b.note;
    text.append(name,note); item.append(icon,text);
    grid.append(item);
  });
  $('badgeBackdrop').classList.add('visible');
}
function sound(freq, seconds = .13, type = 'sine', gain = .07) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq,audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(100,freq*.54),audio.currentTime+seconds);
    g.gain.setValueAtTime(gain,audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+seconds);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+seconds);
  } catch {}
}
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
function floatPoints(points,index) {
  const a = tiles[index].getBoundingClientRect(), p = card.getBoundingClientRect();
  const el = document.createElement('div'); el.className = 'float'; el.textContent = '+' + points;
  el.style.left = (a.left-p.left+a.width/2)+'px'; el.style.top = (a.top-p.top+a.height/2)+'px';
  card.append(el); setTimeout(() => el.remove(),850);
}
function sparks(indices,depth) {
  if(reducedMotion())return;
  const chosen = indices.slice(0,Math.min(indices.length,6));
  for (const i of chosen) {
    const a = tiles[i].getBoundingClientRect(), p = card.getBoundingClientRect();
    const x = a.left-p.left+a.width/2, y = a.top-p.top+a.height/2;
    for (let t=0; t<5; t++) {
      const deg = t/5*Math.PI*2+depth*.55, dist=20+(depth%5)*4;
      const el = document.createElement('span'); el.className = 'spark';
      el.style.left=x+'px'; el.style.top=y+'px'; el.style.width='5px'; el.style.height='5px';
      el.style.background=depth>=3?'#fff1ae':'#ffbe66'; el.style.color=depth>=3?'#fff1ae':'#ffbe66';
      el.style.setProperty('--dx',Math.cos(deg)*dist+'px');
      el.style.setProperty('--dy',Math.sin(deg)*dist+'px');
      card.append(el); setTimeout(() => el.remove(),700);
    }
  }
}
// 一次波次的每个爆炸格子沿实际传播方向亮起能量束（含 ✕ 斜爆格）。
function energyBeams(indices) {
  if(reducedMotion())return;
  const bounds=card.getBoundingClientRect();
  const rects=tiles.map(el=>el.getBoundingClientRect());
  for(const i of indices.slice(0,9)){
    const origin=rects[i],cx=origin.left-bounds.left+origin.width/2,cy=origin.top-bounds.top+origin.height/2;
    const diagonal=types[i]===engine.TYPES.DIAGONAL;
    const targets=(diagonal?engine.getDiagonalNeighbors(i):engine.getNeighbors(i)).filter(k=>types[k]!==engine.TYPES.ROCK);
    for(const j of targets){
      const rr=rects[j],dx=rr.left+rr.width/2-origin.left-origin.width/2,dy=rr.top+rr.height/2-origin.top-origin.height/2;
      const beam=document.createElement('span');beam.className='energy-beam'+(diagonal?' diagonal-beam':'');
      beam.style.left=cx+'px';beam.style.top=cy+'px';beam.style.width=Math.hypot(dx,dy)+'px';beam.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
      card.append(beam);setTimeout(()=>beam.remove(),520);
    }
  }
}
function combo(depth) {
  if (depth < 2 || reducedMotion()) return;
  const el=document.createElement('div'); el.className='combo';
  el.textContent=depth>=5?'⚡ '+depth+' 连爆！':'⚡ '+depth+' 连锁';
  card.append(el); setTimeout(() => el.remove(),620);
}
function rumble(depth) {
  card.classList.remove('shock','flare'); void card.offsetWidth;
  card.classList.add('shock'); if (depth >= 3) card.classList.add('flare');
  setTimeout(() => card.classList.remove('shock','flare'),440);
  if(vibrationOn && !reducedMotion() && navigator.vibrate && depth >= 3) { try{navigator.vibrate(depth>=5?[28,20,30]:23);} catch {} }
}
function snap() { return { board: board.slice(), movesLeft, score, explosions, maxChain, bonusEarned, singleBangMax, targets:[...hitTargets], bossDamage, boostedOnce, diagonalOnce }; }
function undo() {
  if (busy || undoUsed || !undoState || mode === 'blitz' || (ended && mode === 'campaign')) return;
  token++; busy=false; ended=false; levelWon=false; turnForecastOff(); replayFrame=null; boardEl.classList.remove('busy'); clearEffects();
  board=undoState.board.slice(); movesLeft=undoState.movesLeft; score=undoState.score;
  explosions=undoState.explosions; maxChain=undoState.maxChain; bonusEarned=undoState.bonusEarned;
  singleBangMax=undoState.singleBangMax;hitTargets=new Set(undoState.targets);bossDamage=undoState.bossDamage||0;boostedOnce=undoState.boostedOnce;diagonalOnce=undoState.diagonalOnce; undoState=null; undoUsed=true;
  $('endBackdrop').classList.remove('visible'); render(board); updateUI();
  info('已撤回一步。本局不能再次撤回。'); toast('↶ 上一步已撤回'); sound(330,.11);
}
function getNewBadges(won) {
  const earned = [];
  const qualifies = {
    spark: explosions > 0,
    combo3: maxChain >= 3,
    combo6: maxChain >= 6,
    combo10: maxChain >= 10,
    mass: singleBangMax >= 10,
    score500: score >= 500,
    daily: mode === 'daily',
    final: mode === 'campaign' && levelIndex === 7 && won,
    reactor: mode === 'campaign' && levelIndex === 19 && won,
    diagonal: diagonalOnce,
    diagonalFinal: mode === 'campaign' && levelIndex === 25 && won,
    bossFirst: mode === 'campaign' && Boolean(level().boss) && won,
    bossFinal: mode === 'campaign' && level().id === 29 && won,
    boost: boostedOnce,
    target: hitTargets.size > 0,
    overload: threshold === 6 && explosions > 0,
    blitz: mode === 'blitz'
  };
  for (const b of BADGES) if (qualifies[b.id] && !readNumber(badgeKey(b.id))) {
    writeNumber(badgeKey(b.id),1); earned.push(b.name);
  }
  return earned;
}
function victoryShower(){
  const backdrop=$('endBackdrop');
  backdrop.querySelectorAll('.victory-confetti').forEach(el=>el.remove());
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  for(let i=0;i<28;i++){
    const piece=document.createElement('i');piece.className='victory-confetti';
    const n=(i*37%97)/97;
    piece.style.left=(n*100)+'%';piece.style.top=(-6-(i*13)%20)+'%';
    piece.style.setProperty('--drift',((i%2?1:-1)*(16+(i*7)%45))+'px');
    piece.style.setProperty('--duration',(1.8+(i%5)*.18)+'s');
    piece.style.setProperty('--delay',((i*11)%17)/20+'s');
    piece.style.background=['#ff74c3','#ffd168','#80fff2','#c794ff'][i%4];
    backdrop.append(piece);setTimeout(()=>piece.remove(),3500);
  }
}
function grantBossReward(){
  if(mode!=='campaign'||!level().boss||!levelWon)return 0;
  const key=`profmonkey-critical-v09-boss-reward-${level().id}`;
  if(readNumber(key))return 0;
  writeNumber(key,1);writeNumber(CRYSTAL_KEY,crystalBalance()+level().boss.reward);
  return level().boss.reward;
}
function finish() {
  if (ended) return;
  ended = true; stopClock();
  levelWon = goalReached();
  recordFinishedRun(levelWon);
  bossRewardThisFinish=grantBossReward();
  const record = score > savedBest;
  if(record) {savedBest=score;writeNumber(bestKey(),score);}
  let stars=0;
  if (mode === 'campaign' && levelWon) {
    stars = campaign.starsFor(level(),goalState());
    writeNumber(starsKey(levelIndex), Math.max(stars,readNumber(starsKey(levelIndex))));
  }
  const newBadges=getNewBadges(levelWon);
  $('endEmoji').textContent = mode === 'campaign' ? (level().boss && levelWon ? '👾' : levelWon ? '🎉' : '🔋') : record ? '🏆' : maxChain>=5?'⚡':'🎯';
  $('endTitle').textContent = mode === 'campaign' ? (level().boss && levelWon ? 'Boss击破！' : levelWon?'关卡通过！':'能量不足，再试一次') : record?'新纪录！':'挑战完成！';
  $('endDesc').textContent = mode === 'campaign' ? (levelWon ? `${level().name} · 获得 ${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}${level().boss ? (bossRewardThisFinish ? ` · 首通奖励 +${bossRewardThisFinish} 晶核` : ' · Boss奖励已领取') : ''}` : `${campaign.goalText(level())}，调整落点再试试。`) : mode==='daily' ? `每日挑战 · ${localDate()}` : mode==='frenzy' ? `通过连锁赚到 ${bonusEarned} 次额外点击` : mode==='blitz' ? '75 秒结束！下次试试制造更多连爆' : mode==='overload'?`超载${overloadDifficulty==='easy'?'舒适':'挑战'} · 凑到 6 才爆炸`:'试试不同落点，突破自己的纪录。';
  $('endScore').textContent=score.toLocaleString('zh-CN');
  $('endCaption').textContent=mode==='campaign'?campaign.goalText(level()):record?'恭喜你刷新了个人纪录！':'本局最终得分';
  $('endChain').textContent=maxChain+'层';
  $('endExplosions').textContent=explosions;
  $('endBest').textContent=savedBest.toLocaleString('zh-CN');
  const earnedParts=[];if(newBadges.length)earnedParts.push(`🎖 新成就：${newBadges.join('、')}`);if(bossRewardThisFinish)earnedParts.push(`💎 Boss首通奖励 +${bossRewardThisFinish} 晶核`);$('earnedLine').textContent=earnedParts.join(' · ');
  updateUI();
  $('endBackdrop').classList.add('visible');
  if(levelWon||record)victoryShower();
  (levelWon && levelIndex<campaign.LEVELS.length-1 ? $('endNext') : $('endRestart')).focus({preventScroll:true});
  if (record || levelWon) sound(800,.3,'triangle',.06);
}
function useHint() {
  if (busy || ended || hintUsed || (mode === 'blitz' ? timeLeft <= 0 : movesLeft < 1)) return;
  hintUsed = true;
  const hintLevel = mode==='campaign' && level().goal==='boss' && bossDamage>=level().boss.hp ? null : (mode==='campaign' ? level() : null);
  const h = campaign.hint(board, hintLevel, engine, [...hitTargets], {threshold, types});
  clearEffects(); tiles[h.index].classList.add('hinted');
  const row = Math.floor(h.index/SIZE)+1, col = h.index%SIZE+1;
  info(mode==='campaign'&&level().goal==='boss'&&bossDamage<level().boss.hp ? `💡 建议点第 ${row} 行第 ${col} 列：Boss核心点击 +2，蓄满爆炸即可削减 1 HP。` : `💡 试试第 ${row} 行第 ${col} 列：立即 ${h.chain} 层连锁、${h.points} 分${mode==='campaign'&&level().goal==='targets'?`，新增目标 ${h.targets} 个`:''}。只是一步参考，不保证通关。`,true);
  updateUI(); toast('已标亮一个推荐落点');
}
async function tap(i) {
  if (busy || ended || (mode==='blitz'?timeLeft<=0:movesLeft<=0) || $('endBackdrop').classList.contains('visible') || $('levelBackdrop').classList.contains('visible') || $('badgeBackdrop').classList.contains('visible') || $('rulesBackdrop').classList.contains('visible') || $('tutorialBackdrop').classList.contains('visible')) return;
  if(forecastOn){showForecast(i);return;}
  busy=true; boardEl.classList.add('busy'); clearEffects();
  const beforeBoard=board.slice();
  const myToken=token; if(mode==='blitz') startClock();undoState=snap();if(mode!=='blitz')movesLeft--;
  const result=applyMove(board,i,{threshold,types});
  replayFrame={initial:result.initial.slice(),waves:result.waves.map(w=>({...w,board:w.board.slice(),cells:w.cells.slice()})),before:beforeBoard};
  if(types[i]===engine.TYPES.AMPLIFIER && result.detonations>0)boostedOnce=true;
  if(result.waves.some(w=>w.cells.some(k=>types[k]===engine.TYPES.DIAGONAL)))diagonalOnce=true;
  singleBangMax=Math.max(singleBangMax,result.detonations);
  render(result.initial); tiles[i].classList.add('selected'); updateUI();
  let bossDamagedThisMove=false;
  sound(280,.05,'triangle',.045); await pause(waveDelay(85));
  if (myToken!==token) return;
  tiles[i].classList.remove('selected');
  if(!result.waves.length) { board=result.board;render(board);info(types[i] === engine.TYPES.AMPLIFIER ? '🔷 放大格 +2！继续蓄能，凑到临界值就会爆炸。' : `数字 +1。让几个 ${threshold-1} 靠近，准备连锁。`); }
  else {
    for(const wave of result.waves) {
      if(myToken!==token) return;
      info(`⚡ 第 ${wave.depth} 层爆炸！`,true);
      wave.cells.forEach(k=>tiles[k].classList.add('bursting'));
      sparks(wave.cells,wave.depth); energyBeams(wave.cells); if(wave.depth>=2) combo(wave.depth);
      rumble(wave.depth); sound(240+wave.depth*68,Math.min(.2,.09+.013*wave.depth),'triangle',.045);
      await pause(waveDelay(wave.depth>=8?80:115)); if(myToken!==token)return;
      wave.cells.forEach(k=>tiles[k].classList.remove('bursting'));
      for(const k of wave.cells)if(types[k]===engine.TYPES.TARGET)hitTargets.add(k);
      if(mode==='campaign' && level().boss && !bossDamagedThisMove && wave.cells.some(k=>types[k]===engine.TYPES.BOSS)){bossDamage=Math.min(level().boss.hp,bossDamage+1);bossDamagedThisMove=true;info(`👾 Boss核心被引爆！生命 -1 · 剩余 ${Math.max(0,level().boss.hp-bossDamage)} HP`,true);sound(160,.18,'sawtooth',.06);}
      render(wave.board); score+=wave.points; explosions+=wave.cells.length; maxChain=Math.max(maxChain,wave.depth);
      updateUI(); floatPoints(wave.points,wave.cells[0]); await pause(waveDelay(wave.depth>=8?45:75));
    }
    board=result.board;
    if(mode==='frenzy' && result.depth>=3 && bonusEarned<3) {
      movesLeft++; bonusEarned++;
      info(`🔥 ${result.depth} 层连爆，奖励额外 +1 步！`,true);sound(650,.22,'triangle',.065);
    } else info(result.depth>=2?`漂亮！${result.depth} 层连锁，+${result.points} 分！`:`爆炸成功！+${result.points} 分！`,result.depth>=3);
  }
  busy=false;boardEl.classList.remove('busy');updateUI();
  // 关卡达标不自动中断：剩余操作可用来冲 2/3 星；玩家也可以主动结算。
  if(goalReached() && movesLeft>0) {
    const st=campaign.starsFor(level(),goalState());
    info(st===3?'🏆 三星已满足！可以领取通关，或继续刷分。':`✅ 目标达成！${campaign.nextStarText(level(),goalState())}，也可以立即结算。`,true);
  }
  if(mode==='blitz' && timeLeft<=0){finish();return;}
  if(mode!=='blitz' && movesLeft===0){await pause(waveDelay(400));if(myToken===token)finish();}
}
async function share(withScore) {
  const text = withScore ? (mode==='campaign'
    ? `🐒 《临界点》第${level().id}关「${level().name}」${levelWon?'通关':'挑战'}，得分 ${score}，连锁 ${maxChain} 层！💥 你也来试试！`
    : `🐒 我在《临界点》${configs[mode].name}${mode==='overload'?(overloadDifficulty==='easy'?'·舒适':'·挑战'):''}模式拿了 ${score} 分！💥 炸了 ${explosions} 次，最长 ${maxChain} 层连锁。来试试能不能超过我！`)
    : '🐒 来玩《临界点》！点击数字 +1，达到 4 就会连锁爆炸。';
  let ok = false;
  if(navigator.share) { try { await navigator.share({title:'临界点 · ProfMonkey',text});ok=true; } catch(e) { if(e.name==='AbortError') return; } }
  if(!ok){try{await navigator.clipboard.writeText(text);ok=true;}catch{try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();ok=document.execCommand('copy');t.remove();}catch{}}}
  toast(ok?'已复制战绩文字，发送给朋友即可！':'分享暂不可用，可以截图分享。');
}
for(let i=0;i<SIZE*SIZE;i++) {
  const b=document.createElement('button');b.className='cell';b.type='button';b.addEventListener('click',()=>tap(i));tiles.push(b);boardEl.append(b);
}
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('undo').addEventListener('click',undo);$('endUndo').addEventListener('click',undo);
$('restart').addEventListener('click',()=>init(false));$('endRestart').addEventListener('click',()=>init(false));
$('newBoard').addEventListener('click',()=>mode==='campaign'?openLevels():mode!=='daily'?init(true):null);
$('endNew').addEventListener('click',()=>mode==='campaign'?($('endBackdrop').classList.remove('visible'),openLevels()):mode!=='daily'?init(true):null);
$('endNext').addEventListener('click',()=>{if(mode==='campaign'&&levelWon&&levelIndex<campaign.LEVELS.length-1)chooseLevel(levelIndex+1);});
$('endClose').addEventListener('click',()=>init(false));
$('levelPicker').addEventListener('click',openLevels);
$('closeLevels').addEventListener('click',()=>$('levelBackdrop').classList.remove('visible'));
$('hint').addEventListener('click',useHint);
$('forecast').addEventListener('click',()=>{
  if(busy||ended)return;
  forecastOn=!forecastOn;resetForecastSelection();
  $('forecast').setAttribute('aria-pressed',String(forecastOn));
  $('forecast').textContent=forecastOn?'🔮 战术预览：开':'🔮 战术预览：关';
  info(forecastOn?'🔮 点任意格，提前查看本步结果；确认后才引爆。':'已退出预测，恢复点一下直接引爆。');
});
$('predictionCancel').addEventListener('click',()=>{turnForecastOff();info('已取消预测，恢复正常落子。');});
$('predictionConfirm').addEventListener('click',()=>{
  if(forecastSelection===null || busy || ended)return;
  const i=forecastSelection;turnForecastOff();void tap(i);
});
$('replayLast').addEventListener('click',()=>void replayLastMove());
$('endReplay').addEventListener('click',()=>void replayLastMove(true));
$('pace').addEventListener('click',()=>{fastPace=!fastPace;try{localStorage.setItem(PACE_KEY,fastPace?'fast':'classic');}catch{}syncPace();toast(fastPace?'⚡ 爽快节奏已开启':'🎞 已切换经典节奏');});
$('claimWin').addEventListener('click',()=>{if(!busy && !ended && goalReached())finish();});
document.querySelectorAll('[data-overload-difficulty]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.overloadDifficulty===overloadDifficulty)return;
  overloadDifficulty=b.dataset.overloadDifficulty;
  try{localStorage.setItem('profmonkey-critical-v06-overload',overloadDifficulty);}catch{}
  if(mode==='overload'){init(true);toast(overloadDifficulty==='easy'?'已切换舒适难度：20 步高能棋盘':'已切换挑战难度：16 步普通棋盘');}
}));
$('achievements').addEventListener('click',openBadges);
$('openShop').addEventListener('click',openShop);
$('openQuests').addEventListener('click',openDailyQuests);
$('closeQuests').addEventListener('click',()=>$('questBackdrop').classList.remove('visible'));
$('openProfile').addEventListener('click',openPlayerProfile);
$('closeProfile').addEventListener('click',()=>$('profileBackdrop').classList.remove('visible'));
$('closeShop').addEventListener('click',()=>$('shopBackdrop').classList.remove('visible'));
$('closeBadges').addEventListener('click',()=>$('badgeBackdrop').classList.remove('visible'));
$('help').addEventListener('click',()=>$('rulesBackdrop').classList.add('visible'));
$('closeRules').addEventListener('click',()=>$('rulesBackdrop').classList.remove('visible'));
$('vibration').textContent=vibrationOn?'📳 震动开':'📴 震动关';
$('vibration').setAttribute('aria-pressed',String(vibrationOn));
$('vibration').addEventListener('click',()=>{vibrationOn=!vibrationOn;$('vibration').textContent=vibrationOn?'📳 震动开':'📴 震动关';$('vibration').setAttribute('aria-pressed',String(vibrationOn));try{localStorage.setItem('profmonkey-critical-v08-vibration',vibrationOn?'on':'off');}catch{}if(vibrationOn&&navigator.vibrate)navigator.vibrate(15);});
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'🔊 音效开启':'🔇 音效关闭';$('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)sound(540,.13,'triangle');});
$('shareTop').addEventListener('click',()=>share(false));$('endShare').addEventListener('click',()=>share(true));
function showPoster(){
  if(busy){toast('正在连爆，请等动画结束后生成海报');return;}
  const name=mode==='campaign'?`第 ${level().id} 关 · ${level().name}`:`${configs[mode].name}模式`;
  const data={modeName:name,score,chain:maxChain,explosions,threshold,board:[...board],types:[...types],goal:mode==='campaign'?(levelWon||goalReached()?'挑战达标':'继续挑战'):'高分挑战',date:localDate(),skin:equippedSkin};
  window.CriticalPoster?.open(data);
}
$('posterTop').addEventListener('click',showPoster);$('endPoster').addEventListener('click',showPoster);
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.backdrop.visible:not(#tutorialBackdrop)').forEach(el=>el.classList.remove('visible'));});
applySkin();
syncPace();
init(true);
})();