/* 临界点 v0.9 — 新增六关斜向连爆，旧 20 关存档编号完全不变。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CriticalCampaign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // 固定 20 关编号与目标类型。部分地图重新选种子，使新机制在第 3~6 步左右出现成果。
  // 历史三星存档按关卡编号保留；旧最佳分数仍展示，但不代表新地图可直接复现。
  const base = [
    { id:1, name:'第一声爆炸', sub:'先试试让火花连起来', seed:2, moves:6, goal:'score', target:90 },
    { id:2, name:'火花接力', sub:'一次点击，引发更多层反应', seed:19, moves:7, goal:'chain', target:4 },
    { id:3, name:'火力全开', sub:'累计引爆更多格子', seed:44, moves:8, goal:'explosions', target:16 },
    { id:4, name:'连环风暴', sub:'试着找出高分的起爆点', seed:100, moves:8, goal:'score', target:450 },
    { id:5, name:'深层反应', sub:'让连锁进入第六层', seed:1040, moves:8, goal:'chain', target:7 },
    { id:6, name:'分秒必争', sub:'四次机会，点燃整片棋盘', seed:1000, moves:9, goal:'score', target:650 },
    { id:7, name:'临界风暴', sub:'找到更大的爆炸规模', seed:10, moves:9, goal:'explosions', target:20 },
    { id:8, name:'终极临界点', sub:'冲击千分，引爆最终关卡', seed:1088, moves:10, goal:'score', target:1150 }
  ];
  // types: 'a' 放大格；'r' 石墙；'t' 金色目标；'d' 斜爆格；'b' Boss核心。index = row*6+column, 0-based.
  const extra = [
    {id:9, name:'双倍一击', sub:'⚡ 蓝边格点击一次 +2，其余格仍 +1', seed:771, moves:8, goal:'score', target:200, specials:{a:[14,21]}},
    {id:10, name:'能量共振', sub:'找准放大格，制造更长连锁', seed:25, moves:9, goal:'chain', target:6, specials:{a:[7,14,28]}},
    {id:11, name:'两倍风暴', sub:'组合放大格，引爆更大范围', seed:3, moves:9, goal:'explosions', target:23, specials:{a:[10,17,25]}},
    {id:12, name:'石墙出现', sub:'🧱 灰色墙不能点击，也不接收能量', seed:40, moves:8, goal:'score', target:390, specials:{r:[0,5,30,35]}},
    {id:13, name:'穿越峡谷', sub:'爆炸绕开障碍，寻找另一条连锁路线', seed:69, moves:9, goal:'chain', target:6, specials:{r:[8,20,26]}},
    {id:14, name:'孤岛连爆', sub:'障碍更多，点击机会更珍贵', seed:75, moves:9, goal:'explosions', target:19, specials:{r:[0,5,9,15,30,35]}},
    {id:15, name:'精准爆破', sub:'🎯 引爆标记为金色的格子', seed:252, moves:8, goal:'targets', target:2, specials:{t:[14,15]}},
    {id:16, name:'目标锁定', sub:'金色目标必须参与爆炸才算摧毁', seed:44, moves:9, goal:'targets', target:3, specials:{t:[7,14,21]}},
    {id:17, name:'交叉火力', sub:'放大格帮助清理金色目标', seed:310, moves:10, goal:'targets', target:3, specials:{t:[7,18,26],a:[14,21]}},
    {id:18, name:'数字 4 登场', sub:'达到 5 才爆炸；数字会出现 4', seed:143, moves:10, goal:'score', target:160, threshold:5},
    {id:19, name:'数字 5 登场', sub:'达到 6 才爆炸；数字会出现 5', seed:904, moves:11, goal:'chain', target:4, threshold:6},
    {id:20, name:'最终反应堆', sub:'放大格 + 石墙 + 目标，全部学会！', seed:693, moves:12, goal:'targets', target:3, threshold:5, specials:{a:[9,22],r:[0,5,30,35],t:[13,19,25]}},
    // 第五章：斜向风暴。紫色 ✕ 格爆炸时传给四个斜角（被波及仍 +1）。
    {id:21, name:'斜向启动', sub:'🟣 紫色 ✕ 格爆炸时，能量传给四个斜角', seed:439, moves:8, goal:'score', target:950, specials:{d:[14,22]}},
    {id:22, name:'X 形接力', sub:'利用斜向传播，创造更深的连锁', seed:850, moves:9, goal:'chain', target:6, specials:{d:[7,14,21]}},
    {id:23, name:'折射狂潮', sub:'放大格与斜爆格配合，累计更多爆炸', seed:770, moves:10, goal:'explosions', target:30, specials:{a:[8,27],d:[14,21,28]}},
    {id:24, name:'封锁边界', sub:'石墙挡住直线，斜爆绕开路口', seed:608, moves:10, goal:'score', target:700, specials:{r:[8,20,26],d:[14,21,28]}},
    {id:25, name:'精准折射', sub:'借助斜向传导，击中三个金色目标', seed:42, moves:11, goal:'targets', target:3, specials:{t:[7,19,28],d:[14,21]}},
    {id:26, name:'紫电风暴', sub:'最终挑战：斜爆、放大、石墙与目标一起出现', seed:100, moves:12, goal:'targets', target:3, threshold:5, specials:{r:[0,5,30,35],a:[9,22],d:[14,27],t:[7,19,25]}},
    // 第六章：Boss战。金色核心是Boss的弱点；每个核心真正爆炸，Boss失去1格生命。
    {id:27, name:'熔核巨兽', sub:'Boss战：让核心爆炸3次，击碎熔核护盾', seed:2707, moves:10, goal:'boss', target:3, boss:{name:'熔核巨兽',icon:'🦖',hp:3,reward:2}, specials:{b:[14]}},
    {id:28, name:'机械蜂巢', sub:'Boss战：核心爆炸4次，留意石墙与放大格', seed:1, moves:12, goal:'boss', target:4, boss:{name:'机械蜂巢',icon:'🤖',hp:4,reward:3}, specials:{r:[0,5,30,35],a:[9,26],b:[14]}},
    {id:29, name:'紫电之王', sub:'终极Boss：高临界值下击中核心5次', seed:2, moves:15, goal:'boss', target:5, threshold:5, boss:{name:'紫电之王',icon:'👾',hp:5,reward:5}, specials:{r:[0,5,30,35],a:[8,27],d:[7,21],b:[14]}}
  ];
  // 第二、三星按额外得分获取，不再鼓励点一两下就提前退出。
  // 每关三个奖章的难度已用规则引擎模拟后手工校准；分数制关卡也是如此。
  const STAR_SCORE = [[110,130],[200,320],[350,600],[560,740],[500,900],[700,840],[390,700],[1190,1260],[350,520],[600,1000],[750,1060],[420,510],[450,720],[380,520],[1500,2200],[400,680],[500,950],[300,450],[350,680],[700,1270],[1250,1750],[700,1050],[1200,1850],[970,1400],[800,1150],[550,750],[850,1150],[1000,1450],[1100,1650]];
  const LEVELS = Object.freeze([...base, ...extra].map(x => {
    const [star2,star3] = STAR_SCORE[x.id-1];
    return Object.freeze({...x,star2,star3});
  }));
  const TYPES = {score:{label:'总得分',unit:'分'},chain:{label:'最长连锁',unit:'层'},explosions:{label:'总爆炸数',unit:'次'},targets:{label:'累计引爆目标',unit:'个'},boss:{label:'Boss生命削减',unit:'格'}};
  function typesFor(level, engine) {
    const types = Array(engine.SIZE*engine.SIZE).fill(engine.TYPES.NORMAL);
    if (level?.specials) {
      for (const [key, cells] of Object.entries(level.specials)) {
        const type = {a:engine.TYPES.AMPLIFIER,r:engine.TYPES.ROCK,t:engine.TYPES.TARGET,d:engine.TYPES.DIAGONAL,b:engine.TYPES.BOSS}[key];
        if (type == null) throw new Error('Unknown special cell: '+key);
        for(const i of cells) { if (i<0 || i>=types.length || types[i]!==0) throw new Error('Overlapping cell types'); types[i] = type; }
      }
    }
    return types;
  }
  function optionsFor(level,engine) {return {threshold:level?.threshold || 4, types:typesFor(level,engine), warmStart:level?.threshold>=5};}
  function currentValue(level,state) {if(!level || !TYPES[level.goal]) throw new Error('Unknown level target'); const n = Number(state[level.goal]); return Number.isFinite(n)?Math.max(0,n):0;}
  function goalText(level) {return `${TYPES[level.goal].label}达到 ${level.target} ${TYPES[level.goal].unit}`;}
  function starsFor(level,state) {
    if(currentValue(level,state)<level.target)return 0;
    const points=Math.max(0,Number(state.score)||0);
    return 1 + (points>=level.star2?1:0) + (points>=level.star3?1:0);
  }
  function nextStarText(level,state) {
    const stars=starsFor(level,state);
    if(stars===0) return '先完成本关任务';
    if(stars===1) return `再得 ${Math.max(0,level.star2-state.score)} 分升到 2 星`;
    if(stars===2) return `再得 ${Math.max(0,level.star3-state.score)} 分升到 3 星`;
    return '三星已拿满！';
  }
  function hint(board,level,engine,alreadyHit = [],opts) {
    const options=opts || optionsFor(level,engine), hit=new Set(alreadyHit);
    let best=null;
    for(let i=0;i<board.length;i++) {
      if(options.types[i]===engine.TYPES.ROCK) continue;
      const r=engine.applyMove(board,i,options);
      const gained = r.hitTargets.filter(x=>!hit.has(x)).length;
      const objective=level?.goal==='chain'?r.depth:level?.goal==='explosions'?r.detonations:level?.goal==='targets'?gained:level?.goal==='boss'?(r.hitBosses?.length?1:0):r.points;
      if(!best || objective>best.objective || (objective===best.objective && r.points>best.points))
        best={index:i,objective,points:r.points,chain:r.depth,explosions:r.detonations,targets:gained};
    }
    // Boss战如果本步不能直接造成伤害，提示应继续给核心蓄能，而不是推荐无关高分格。
    if(level?.goal==='boss' && best?.objective===0){
      const core=options.types.indexOf(engine.TYPES.BOSS);
      if(core>=0){const r=engine.applyMove(board,core,options);return {index:core,objective:0,points:r.points,chain:r.depth,explosions:r.detonations,targets:0};}
    }
    return best;
  }
  return {LEVELS,TYPES,typesFor,optionsFor,currentValue,goalText,starsFor,nextStarText,hint};
});