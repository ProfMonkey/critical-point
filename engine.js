/* 临界点 v0.9 — 纯规则引擎：新增斜爆格（对角传导）。保留旧棋盘与记分。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CriticalEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 6, MOVES = 12;
  const TYPES = Object.freeze({ NORMAL: 0, AMPLIFIER: 1, TARGET: 2, ROCK: 3, DIAGONAL: 4, BOSS: 5 });

  function rngFromSeed(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function boardFromSeed(seed, opts = {}) {
    const threshold = opts.threshold || 4;
    if (!Number.isInteger(threshold) || threshold < 4 || threshold > 6) throw new RangeError('Threshold must be 4..6');
    const rand = rngFromSeed(seed);
    const board = Array.from({ length: SIZE * SIZE }, () => {
      const p = rand();
      // Preserve all v0.3 normal board seeds and their solved campaign paths.
      if (threshold === 4) return p < .13 ? 0 : p < .33 ? 1 : p < .66 ? 2 : 3;
      // 超载舒适难度：保持「达到 6 才爆炸」，但增加临界值附近的起始格。
      // 对其它阈值/关卡不生效，保证旧关卡和每日盘的随机序列不变。
      if (threshold === 5 && opts.warmStart) return p < .07 ? 0 : p < .17 ? 1 : p < .35 ? 2 : p < .68 ? 3 : 4;
      if (threshold === 6 && opts.warmStart) return p < .05 ? 0 : p < .13 ? 1 : p < .27 ? 2 : p < .49 ? 3 : p < .75 ? 4 : 5;
      if (threshold === 5 && opts.hotStart) return p < .04 ? 0 : p < .12 ? 1 : p < .25 ? 2 : p < .57 ? 3 : 4;
      if (threshold === 6 && opts.hotStart) return p < .04 ? 0 : p < .10 ? 1 : p < .20 ? 2 : p < .40 ? 3 : p < .72 ? 4 : 5;
      return Math.min(threshold-1, Math.floor(p * threshold));
    });
    if (!board.some((v,i) => v === threshold-1 && i % SIZE > 0 && i % SIZE < SIZE - 1)) board[14] = threshold - 1;
    if (opts.types) {
      if (!Array.isArray(opts.types) || opts.types.length !== SIZE*SIZE) throw new TypeError('Expected 36 cell types');
      opts.types.forEach((t,i) => { if(t === TYPES.ROCK) board[i] = -1; });
    }
    return board;
  }
  function getNeighbors(i) {
    const x = i % SIZE, y = Math.floor(i / SIZE), neighbors = [];
    if (x > 0) neighbors.push(i-1);
    if (x < SIZE-1) neighbors.push(i+1);
    if (y > 0) neighbors.push(i-SIZE);
    if (y < SIZE-1) neighbors.push(i+SIZE);
    return neighbors;
  }
  // 斜爆格仅改变爆炸传播方向：传给左上、右上、左下、右下，始终不超过 4 个方向。
  function getDiagonalNeighbors(i) {
    const x=i%SIZE,y=Math.floor(i/SIZE),out=[];
    for(const dy of [-1,1])for(const dx of [-1,1]) {
      const nx=x+dx,ny=y+dy;
      if(nx>=0&&nx<SIZE&&ny>=0&&ny<SIZE)out.push(ny*SIZE+nx);
    }
    return out;
  }
  function applyMove(input, index, opts = {}) {
    const threshold = opts.threshold || 4;
    if (!Number.isInteger(threshold) || threshold < 4 || threshold > 6) throw new RangeError('Threshold must be 4..6');
    const types = opts.types || Array(SIZE*SIZE).fill(TYPES.NORMAL);
    if (!Array.isArray(types) || types.length !== SIZE*SIZE || !types.every(x => [0,1,2,3,4,5].includes(x))) throw new TypeError('Expected 36 valid cell types');
    if (!Array.isArray(input) || input.length !== SIZE*SIZE || !input.every((n,i) => Number.isInteger(n) && (types[i] === TYPES.ROCK ? n === -1 : n >= 0 && n < threshold))) throw new TypeError('Expected stable board and matching rocks');
    if (!Number.isInteger(index) || index < 0 || index >= input.length) throw new RangeError('Bad cell index');
    if (types[index] === TYPES.ROCK) throw new RangeError('Cannot click a rock');
    const board = input.slice();
    board[index] += (types[index] === TYPES.AMPLIFIER || types[index] === TYPES.BOSS) ? 2 : 1;
    const initial = board.slice(), waves = [], hitTargets = new Set(), hitBosses = new Set();
    let total = 0, detonations = 0, iterations = 0;
    while (true) {
      const bursting = [];
      for (let i=0;i<board.length;i++) if(board[i] >= threshold) bursting.push(i);
      if (bursting.length === 0) break;
      if (++iterations > 3000) throw new Error('Non-terminating avalanche');
      for (const i of bursting) {
        board[i] -= threshold;
        if (types[i] === TYPES.TARGET) hitTargets.add(i);
        if (types[i] === TYPES.BOSS) hitBosses.add(i);
      }
      for (const i of bursting) {
        const neighbors = types[i]===TYPES.DIAGONAL ? getDiagonalNeighbors(i) : getNeighbors(i);
        for (const nb of neighbors) if(types[nb] !== TYPES.ROCK) board[nb]++;
      }
      const points = bursting.length * iterations * 10;
      total += points;
      detonations += bursting.length;
      waves.push({cells:bursting, board:board.slice(), points, depth:iterations});
    }
    return { board, initial, waves, points:total, detonations, depth:waves.length, hitTargets:[...hitTargets].sort((a,b)=>a-b), hitBosses:[...hitBosses].sort((a,b)=>a-b) };
  }
  return { SIZE, MOVES, TYPES, boardFromSeed, applyMove, getNeighbors, getDiagonalNeighbors };
});