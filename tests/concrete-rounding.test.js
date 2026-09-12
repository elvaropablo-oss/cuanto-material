const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function calculate(values){
  let ready;
  const element=()=>({children:[],append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},set innerHTML(value){this.children=[]}});
  const nodes=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value:String(value)}]));
  for(const id of ['resultMain','resultSub','metrics'])nodes[id]=element();
  const form={dataset:{calculator:'concrete'},addEventListener(){}};
  const document={getElementById:id=>nodes[id],querySelector:s=>s==='[data-calculator]'?form:s.startsWith('script[')?{}:null,createElement:element,addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')ready=fn}};
  vm.runInNewContext(fs.readFileSync('assets/calculators.js','utf8'),{document,window:{},Intl,Number,Math});ready();
  return Object.fromEntries(nodes.metrics.children.map(row=>[row.children[1].textContent,row.children[0].textContent]));
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
