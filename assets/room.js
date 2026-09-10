(()=>{
const $=id=>document.getElementById(id),num=id=>{const v=parseFloat($(id)?.value);return Number.isFinite(v)?v:0},fmt=(v,d=1)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:d}).format(v),money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(v),ceil=Math.ceil;
let current=null;
function calculate(){
 const L=num('roomLength'),W=num('roomWidth'),H=num('roomHeight'),open=num('roomOpenings'),doors=num('roomDoors');
 const wall=Math.max(0,2*(L+W)*H-open),floor=L*W,paintCeiling=$('roomCeiling')?.checked;
 const coats=Math.max(1,num('paintCoats')),yieldv=Math.max(.1,num('paintYield')),paintWaste=num('paintWaste')/100;
 const paintArea=wall+(paintCeiling?floor:0),liters=paintArea*coats/yieldv*(1+paintWaste);
 const floorWaste=num('floorWaste')/100,coverage=Math.max(.01,num('floorCoverage')),floorNeed=floor*(1+floorWaste),boxes=ceil(floorNeed/coverage);
 const skirtWaste=num('skirtWaste')/100,piece=Math.max(.01,num('skirtPiece')),skirtNet=Math.max(0,2*(L+W)-doors),skirtNeed=skirtNet*(1+skirtWaste),skirtPieces=ceil(skirtNeed/piece);
 const paintPrice=num('paintPrice'),boxPrice=num('floorBoxPrice'),skirtPrice=num('skirtPrice');
 const costs=[paintPrice?liters*paintPrice:0,boxPrice?boxes*boxPrice:0,skirtPrice?skirtPieces*skirtPrice:0],cost=costs.reduce((a,b)=>a+b,0);
 current={title:'Reforma de habitación',source:'reforma-habitacion.html',main:`${fmt(floor,1)} m² de habitación`,sub:`Paredes netas: ${fmt(wall,1)} m²`,cost:cost||null,metrics:[['Pintura',`${fmt(liters,1)} L`],['Suelo laminado',`${boxes} cajas`],['Rodapié',`${skirtPieces} piezas`],['Superficie de suelo',`${fmt(floorNeed,1)} m² con merma`],['Coste estimado',cost?money(cost):'Añade precios para calcularlo']]};
 $('roomResultMain').textContent=current.main;$('roomResultSub').textContent=current.sub;const box=$('roomMetrics');box.innerHTML='';current.metrics.forEach(([l,v])=>{const d=document.createElement('div');d.className='metric';const b=document.createElement('b');b.textContent=v;const s=document.createElement('span');s.textContent=l;d.append(b,s);box.appendChild(d)});
}
async function copy(){if(!current)return;const text=['CuántoMaterial · Reforma de habitación',current.main,current.sub,...current.metrics.map(([l,v])=>`${l}: ${v}`)].join('\n');try{await navigator.clipboard.writeText(text);window.cmToast?.('Lista copiada');window.cmTrack?.('result_copy',{calculator_name:'room_project'})}catch{window.cmToast?.('No se pudo copiar')}}
document.addEventListener('DOMContentLoaded',()=>{const f=document.querySelector('[data-room-calculator]');if(!f)return;let timer;f.addEventListener('submit',e=>{e.preventDefault();if(!f.reportValidity())return;calculate();window.cmTrack?.('calculator_calculate',{calculator_name:'room_project'})});f.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(calculate,120)});f.addEventListener('change',calculate);$('roomCopy')?.addEventListener('click',copy);$('roomAdd')?.addEventListener('click',()=>{if(!current)return;window.CMProject?.add(current);window.cmToast?.('Añadido a Mi proyecto');window.cmTrack?.('project_add',{calculator_name:'room_project'})});calculate();});
})();