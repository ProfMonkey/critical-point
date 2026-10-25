const assert = require('node:assert/strict');
const E = require('./engine');
const C = require('./campaign');
assert.equal(E.SIZE,6);
assert.equal(C.LEVELS.length,29);
assert.deepEqual(E.boardFromSeed(123),E.boardFromSeed(123));
assert.notDeepEqual(E.boardFromSeed(123),E.boardFromSeed(124));
assert.equal(E.getNeighbors(0).length,2);
assert.equal(E.getNeighbors(14).length,4);
assert.deepEqual(E.boardFromSeed(2),E.boardFromSeed(2,{threshold:4}));
const basic=Array(36).fill(0); basic[14]=3; basic[15]=3;
const ex=E.applyMove(basic,14);
assert.equal(ex.depth,2);assert.equal(ex.points,30);assert.equal(ex.board[14],1);
assert.equal(basic[14],3);
for(let seed=0;seed<200;seed++){
  let board=E.boardFromSeed(seed);
  for(let i=0;i<12;i++){let r=E.applyMove(board,(seed+i*17)%36);assert(r.board.every(n=>n>=0&&n<=3));board=r.board;}
}
// Amplifier: +2 only for directly clicked special cell; normal hits retain +1.
const boostTypes=Array(36).fill(E.TYPES.NORMAL);boostTypes[14]=E.TYPES.AMPLIFIER;
const amp=Array(36).fill(0);amp[14]=2;
assert.equal(E.applyMove(amp,14).depth,0);
const amplified=E.applyMove(amp,14,{types:boostTypes});
assert.equal(amplified.depth,1);assert.equal(amplified.board[14],0);
assert.equal(amplified.board[13],1);
// Rock cannot be clicked, cannot receive energy.
const rockTypes=Array(36).fill(0);rockTypes[13]=E.TYPES.ROCK;
const rocked=Array(36).fill(0);rocked[14]=3;rocked[13]=-1;
assert.throws(()=>E.applyMove(rocked,13,{types:rockTypes}), /rock/);
const afterRock=E.applyMove(rocked,14,{types:rockTypes});
assert.equal(afterRock.board[13],-1);assert.equal(afterRock.board[15],1);
// Marked targets only count when detonated.
const targetTypes=Array(36).fill(0);targetTypes[14]=E.TYPES.TARGET;
const targetBoard=Array(36).fill(0);targetBoard[14]=3;
assert.deepEqual(E.applyMove(targetBoard,14,{types:targetTypes}).hitTargets,[14]);
assert.deepEqual(E.applyMove(Array(36).fill(0),14,{types:targetTypes}).hitTargets,[]);
// Numeric 4,5 available only at higher thresholds.
for(const threshold of [5,6]){
  const b=Array(36).fill(0);b[14]=threshold-1;
  const r=E.applyMove(b,14,{threshold});assert.equal(r.depth,1);assert.equal(r.board[14],0);
  assert(E.boardFromSeed(124,{threshold}).every(n=>n>=0&&n<threshold));
}
// Diagonal tile emits energy ONLY to diagonally adjacent cells (four diagonal directions), not orthogonal.
const diagTypes=Array(36).fill(E.TYPES.NORMAL);diagTypes[14]=E.TYPES.DIAGONAL;
const diagBoard=Array(36).fill(0);diagBoard[14]=3;
const diag=E.applyMove(diagBoard,14,{types:diagTypes});
assert.equal(diag.depth,1);
assert.deepEqual(E.getDiagonalNeighbors(14).sort((a,b)=>a-b),[7,9,19,21]);
for (const i of [7,9,19,21])assert.equal(diag.board[i],1);
for (const i of [8,13,15,20])assert.equal(diag.board[i],0);
assert.equal(diag.board[14],0);
// Boss core: direct click +2; propagation +1; report boss detonation.
const bossTypes=Array(36).fill(E.TYPES.NORMAL);bossTypes[14]=E.TYPES.BOSS;
const bossBoard=Array(36).fill(0);bossBoard[14]=2;
const bossHit=E.applyMove(bossBoard,14,{types:bossTypes});
assert.equal(bossHit.initial[14],4);assert.deepEqual(bossHit.hitBosses,[14]);
assert.equal(bossHit.board[13],1);assert.equal(bossHit.board[15],1);
// A wall also blocks diagonal energy. Border cells have fewer diagonal neighbors.
const diagonalWallTypes=diagTypes.slice();diagonalWallTypes[7]=E.TYPES.ROCK;
const diagonalWallBoard=diagBoard.slice();diagonalWallBoard[7]=-1;
assert.equal(E.applyMove(diagonalWallBoard,14,{types:diagonalWallTypes}).board[7],-1);
assert.deepEqual(E.getDiagonalNeighbors(0),[7]);
assert.equal(C.LEVELS[20].id,21);
assert.equal(C.LEVELS[25].id,26);
assert.equal(C.LEVELS[26].id,27);
assert.equal(C.LEVELS[28].id,29);
assert.equal(C.typesFor(C.LEVELS[20],E)[14],E.TYPES.DIAGONAL);
assert.throws(()=>E.applyMove(Array(36).fill(0),0,{threshold:3}),/Threshold/);
assert.equal(C.starsFor(C.LEVELS[0],{score:0,movesLeft:2}),0);
assert.equal(C.starsFor(C.LEVELS[0],{score:130,movesLeft:2}),3);
assert.equal(C.starsFor(C.LEVELS[0],{score:90,movesLeft:0}),1);
assert.equal(C.currentValue(C.LEVELS[1],{chain:4}),4);
assert.equal(C.currentValue(C.LEVELS[2],{explosions:16}),16);
assert.equal(C.currentValue(C.LEVELS[14],{targets:2}),2);
assert.equal(C.optionsFor(C.LEVELS[17],E).threshold,5);
assert.equal(C.optionsFor(C.LEVELS[18],E).threshold,6);
// Overload comfort must preserve threshold=6 while being observably more playable than the original.
const normal6=E.boardFromSeed(124,{threshold:6});
const comfort6=E.boardFromSeed(124,{threshold:6,hotStart:true});
assert.notDeepEqual(normal6,comfort6);
assert(comfort6.filter(n=>n>=4).length>normal6.filter(n=>n>=4).length);
assert.equal(E.boardFromSeed(124,{threshold:6,hotStart:true}).length,36);
assert.deepEqual(E.boardFromSeed(124,{threshold:5}),E.boardFromSeed(124,{threshold:5,hotStart:false}));
assert(C.LEVELS.every(l=>l.moves>=6));
assert(C.LEVELS.every(l=>l.star3>l.star2));
assert.equal(C.nextStarText(C.LEVELS[0],{score:90}), '再得 20 分升到 2 星');
assert.equal(C.starsFor(C.LEVELS[0],{score:110}), 2);
// All 26 levels are achievable by a simple greedy hint, without cheating.
for(const l of C.LEVELS){
  const opts=C.optionsFor(l,E), allTargets=new Set();let b=E.boardFromSeed(l.seed,opts);
  const state={score:0,chain:0,explosions:0,targets:0,boss:0}, steps=[];
  for(let turn=0;turn<l.moves;turn++){
    const h=C.hint(b,l,E,[...allTargets],opts);assert(h && h.index>=0 && h.index<36);
    const r=E.applyMove(b,h.index,opts);b=r.board;
    state.score+=r.points;state.chain=Math.max(state.chain,r.depth);state.explosions+=r.detonations;
    r.hitTargets.forEach(x=>allTargets.add(x));state.targets=allTargets.size;if(l.goal==='boss'&&r.hitBosses.length)state.boss++;
    steps.push(h.index);
    if(C.currentValue(l,state)>=l.target)break;
  }
  assert(C.currentValue(l,state)>=l.target,`Stage ${l.id} unreachable by tested strategy: ${JSON.stringify(state)}`);
  console.log(`STAGE ${String(l.id).padStart(2,'0')}: PASS (${steps.length}/${l.moves} steps, ${C.goalText(l)}, result ${C.currentValue(l,state)})`);
}
console.log('PASS: v1.0 regression / deterministic rules / 29 levels / Boss core +2 / one-hit-per-move / star criteria');