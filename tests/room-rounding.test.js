const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function calculate(overrides={}){
  const values={roomLength:2.1,roomWidth:1,roomHeight:2.5,roomOpenings:0,roomDoors:0,paintCoats:2,paintYield:10,paintWaste:0,floorCoverage:.7,floorWaste:0,skirtPiece:.7,skirtWaste:0,...overrides};
  const nodes=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value:String(value)}]));
  nodes.roomCeiling={checked:false};
  const document={getElementById:id=>nodes[id],querySelector:s=>s.startsWith('script[')?{}:null,addEventListener(){}};
  const window={};
  const source=fs.readFileSync('assets/room.js','utf8');
  // Expose the real calculator inside the test sandbox without running UI setup.
  assert.ok(source.includes('function warnings(r)'));
  vm.runInNewContext(source.replace('function warnings(r)','window.testCalc=calc;\nfunction warnings(r)'),{document,window,Intl,Number,Math});
  return window.testCalc();
}

test('room skirting at zero normalizes its quantity and cost',()=>{
  const result=calculate({roomDoors:6.2,skirtPrice:10});
  assert.equal(result.pieces,0);
  assert.equal(Object.is(result.pieces,-0),false);
  assert.equal(Object.is(result.cost,-0),false);
});

test('room exact floor packages and a real shortage remain distinct',()=>{
  assert.equal(calculate({floorBoxPrice:10}).boxes,3);
  assert.equal(calculate({floorBoxPrice:10}).cost,30);
  assert.equal(calculate({roomLength:2.100001,floorBoxPrice:10}).boxes,4);
});
