const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function calculate(values,type='concrete'){
  let ready;
  const element=()=>({children:[],append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},set innerHTML(value){this.children=[]}});
  const nodes=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value:String(value)}]));
  for(const id of ['resultMain','resultSub','metrics'])nodes[id]=element();
  const form={dataset:{calculator:type},addEventListener(){},checkValidity(){return true}};
  const document={getElementById:id=>nodes[id],querySelector:s=>s==='[data-calculator]'?form:s.startsWith('script[')?{}:null,createElement:element,addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')ready=fn}};
  vm.runInNewContext(fs.readFileSync('assets/calculators.js','utf8'),{document,window:{},Intl,Number,Math});ready();
  return {...Object.fromEntries(nodes.metrics.children.map(row=>[row.children[1].textContent,row.children[0].textContent])),main:nodes.resultMain.textContent,sub:nodes.resultSub.textContent};
}
test('exact 1200 litres require 96 sacks, not 97 from floating-point noise',()=>{
  const result=calculate({length:4,width:3,thickness:10,waste:0,bagYield:12.5,bagPrice:4});
  assert.equal(result.Sacos,'96 uds');assert.equal(result.Coste,new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(384));
});
test('a real shortage still rounds up and small/large quantities stay correct',()=>{
  for(const [length,width,thickness,sacks] of [[4,3,10.000001,97],[1,1,10,8],[20,10,10,1600]]){
    assert.equal(calculate({length,width,thickness,waste:0,bagYield:12.5,bagPrice:4}).Sacos,sacks+' uds');
  }
});
test('exact package boundaries do not add an extra unit in other calculators',()=>{
  const floor=calculate({area:2.1,coverage:.7,waste:0,boxPrice:10,roomL:0,roomW:0,doors:0,skirtingPiece:2.4},'floor');
  assert.equal(floor.Coste,new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(30));
  const skirting=calculate({roomL:.35,roomW:.35,doors:0,waste:0,pieceLength:.7,piecePrice:2},'skirting');
  assert.equal(skirting.Coste,new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(4));
});
test('a measurable shortage is never rounded down by the tolerance',()=>{
  const result=calculate({area:2.100001,coverage:.7,waste:0,boxPrice:10,roomL:0,roomW:0,doors:0,skirtingPiece:2.4},'floor');
  assert.equal(result.Coste,new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(40));
});
test('zero floor quantity has no negative-zero area or cost',()=>{
  const result=calculate({area:0,coverage:.7,waste:0,boxPrice:10,roomL:0,roomW:0,doors:0,skirtingPiece:2.4},'floor');
  assert.equal(result.main,'0 cajas');
  assert.equal(result.sub,'Comprarías 0 m² de suelo.');
  assert.equal(result.Coste,new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(0));
});
