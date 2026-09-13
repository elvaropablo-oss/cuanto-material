const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),test=require('node:test');
const source=fs.readFileSync('assets/optimizer.js','utf8');
const context={};
vm.runInNewContext(source.slice(source.indexOf('function optimize'),source.indexOf('function readValid')),context);
const optimize=context.optimize;
const pack=(size,price)=>({size,price});
test('centésimas conservan cobertura y coste óptimo a ambos lados de las escalas antiguas',()=>{
  for(const size of [2.55,.55,333.36])for(const target of [.01,11.4,600,600.01,1000,1000.1,6000,6000.01,1000000]){
    const r=optimize(target,[pack(size,10),pack(size,20)]);
    const qty=Math.ceil(target/size-1e-10);
    assert.equal(r.counts[0],qty);assert.equal(r.counts[1],0);assert.equal(r.cost,qty*10);
    assert.ok(r.bought+1e-9>=target);assert.ok(r.waste>=0);assert.equal(r.saving,0);
  }
});
test('mezclar formatos conserva el ejemplo comercial y cantidades grandes',()=>{
  const formats=[pack(2.5,18),pack(4,25),pack(10,52)];
  const r=optimize(11.4,formats);assert.equal(r.cost,70);assert.deepEqual([...r.counts],[1,0,1]);assert.equal(r.bought,12.5);assert.equal(r.saving,5);
  const large=optimize(1000000,formats);assert.equal(large.cost,5200000);assert.equal(large.bought,1000000);
});
function oracle(target,formats){
  const t=Math.round(target*100),sizes=formats.map(f=>Math.round(f.size*100)),prices=formats.map(f=>Math.round(f.price*100));
  const limit=t+Math.max(...sizes)-1,cost=Array(limit+1).fill(Infinity);cost[0]=0;
  for(let a=1;a<=limit;a++)for(let i=0;i<sizes.length;i++)if(a>=sizes[i])cost[a]=Math.min(cost[a],cost[a-sizes[i]]+prices[i]);
  let best=t;for(let a=t;a<=limit;a++)if(cost[a]<cost[best])best=a;
  return{cost:cost[best]/100,bought:best/100};
}
test('oráculo independiente sin compresión confirma coste mínimo y menor sobrante',()=>{
  const families=[[pack(.06,.03),pack(.10,.04),pack(.15,.08)],[pack(.13,.07),pack(.21,.09),pack(.34,.16)],[pack(.03,0),pack(.07,0),pack(.11,.01)]];
  for(const formats of families)for(let n=1;n<=120;n+=3){
    const target=n/100,expected=oracle(target,formats),r=optimize(target,formats);
    assert.equal(r.cost,expected.cost);assert.equal(r.bought,expected.bought);assert.ok(r.bought>=target);
  }
});
test('entradas imposibles fallan sin reservar memoria ni dar un resultado aproximado',()=>{
  for(const target of [-1,0,NaN,Infinity])assert.equal(optimize(target,[pack(20,5)]),null);
  for(const size of [0,-1,NaN,Infinity])assert.equal(optimize(10,[pack(size,5)]),null);
  assert.equal(optimize(10,[pack(.005,5)]),null);assert.equal(optimize(10,[pack(2,Infinity)]),null);
  assert.equal(optimize(1e20,[pack(20,5)]),null);
  const large=optimize(1e8,[pack(2.55,10),pack(2.56,11)]);assert.ok(large.bought>=1e8);assert.ok(large.cost<=large.bestSingle.cost);
  assert.equal(optimize(1e8,[pack(9999.97,99),pack(9999.99,100)]),null);
  assert.equal(optimize(10,[]),null);assert.equal(optimize(10,null),null);
});
