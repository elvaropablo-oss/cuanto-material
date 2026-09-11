(()=>{
'use strict';
const PARAM='calc';
const form=document.querySelector('[data-calculator]');
if(!form)return;
const type=form.dataset.calculator||'';
const resultCard=document.querySelector('.result-card');
const formulas={
  paint:['Superficie = 2 × (largo + ancho) × altura − huecos + techo opcional','Litros = superficie × manos ÷ rendimiento × (1 + margen/100)'],
  tile:['Superficie por pieza = (largo cm ÷ 100) × (ancho cm ÷ 100)','Piezas = techo(superficie × (1 + merma/100) ÷ superficie por pieza)','Cajas = techo(piezas ÷ piezas por caja)'],
  floor:['Suelo necesario = superficie × (1 + merma/100)','Cajas = techo(suelo necesario ÷ cobertura por caja)','Rodapié = (2 × (largo + ancho) − puertas) × 1,08'],
  wallpaper:['Largo de tira = altura + margen de corte, ajustado al rapport si existe','Tiras = techo(perímetro ÷ ancho de rollo), aplicando margen','Rollos = techo(tiras con margen ÷ tiras que caben por rollo)'],
  concrete:['Volumen base = largo × ancho × espesor en metros','Volumen recomendado = volumen base × (1 + margen/100)','Sacos = techo(litros necesarios ÷ rendimiento por saco)'],
  bricks:['Superficie neta = largo × alto − huecos','Módulo de pieza = (largo + junta) × (alto + junta)','Piezas = techo(superficie neta ÷ módulo × (1 + margen/100))'],
  drywall:['Superficie = largo × alto × número de caras','Placas = techo(superficie × (1 + margen/100) ÷ superficie de una placa)','Montantes = techo(largo ÷ separación) + 1'],
  skirting:['Perímetro neto = 2 × (largo + ancho) − ancho de puertas','Metros necesarios = perímetro neto × (1 + margen/100)','Piezas = techo(metros necesarios ÷ longitud de cada pieza)'],
  insulation:['Superficie necesaria = superficie × (1 + margen/100)','Paquetes = techo(superficie necesaria ÷ cobertura por paquete)'],
  mortar:['Volumen = superficie × espesor en metros × (1 + margen/100)','Litros = volumen × 1000','Sacos = techo(litros ÷ rendimiento por saco)'],
  cooling:['Volumen = largo × ancho × alto','Frigorías base = volumen × 40','Resultado = base × factor de orientación × factor de aislamiento × factor de ventanas + corrección por personas'],
  aggregate:['Volumen = superficie × profundidad en metros × (1 + margen/100)','Peso = volumen × densidad','Sacos = techo(peso total ÷ peso por saco)']
};
const fields=()=>[...form.elements].filter(el=>(el instanceof HTMLInputElement||el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement)&&el.id&&!['submit','reset','button','file','hidden'].includes((el.type||'').toLowerCase()));
const encode=()=>({v:1,f:type,x:fields().map(el=>[el.id,el.value,(el.type||el.tagName).toLowerCase(),el.checked?1:0])});
function writeState(){const url=new URL(location.href);url.searchParams.set(PARAM,JSON.stringify(encode()));history.replaceState(null,'',url)}
function restore(){const raw=new URL(location.href).searchParams.get(PARAM);if(!raw)return false;let state;try{state=JSON.parse(raw)}catch{return false}if(state?.v!==1||state.f!==type||!Array.isArray(state.x))return false;state.x.forEach(([id,value,inputType,checked])=>{const el=document.getElementById(id);if(!el||!form.contains(el))return;if(inputType==='checkbox'||inputType==='radio')el.checked=checked===1;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});return true}
function labelText(el){return (el.labels?.[0]?.textContent||el.closest('.field')?.querySelector('label')?.textContent||el.id).replace(/\s+/g,' ').trim()}
function valueText(el){if(el.type==='checkbox')return el.checked?'Sí':'No';if(el.type==='radio'&&!el.checked)return'';return el.value}
function ensureExplanation(){
  if(!resultCard||!formulas[type]?.length)return;
  let details=resultCard.querySelector('[data-cm-explanation]');
  if(!details){details=document.createElement('details');details.dataset.cmExplanation='';details.className='cm-explanation';const summary=document.createElement('summary');summary.textContent='¿Cómo sale este resultado?';const body=document.createElement('div');body.className='cm-explanation-body';details.append(summary,body);resultCard.append(details)}
  const body=details.querySelector('.cm-explanation-body');body.replaceChildren();
  formulas[type].forEach(text=>{const p=document.createElement('p');p.className='cm-formula';p.textContent=text;body.append(p)});
  const used=fields().filter(el=>el.type!=='radio'||el.checked).filter(el=>valueText(el)!=='');if(used.length){const strong=document.createElement('strong');strong.textContent='Datos usados';const ul=document.createElement('ul');used.forEach(el=>{const li=document.createElement('li');li.textContent=`${labelText(el)}: ${valueText(el)}`;ul.append(li)});body.append(strong,ul)}
}
async function copyLink(button){writeState();try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(location.href);else{const ta=document.createElement('textarea');ta.value=location.href;ta.style.cssText='position:fixed;opacity:0';document.body.append(ta);ta.select();document.execCommand('copy');ta.remove()}const old=button.textContent;button.textContent='Enlace copiado ✓';window.cmToast?.('Enlace del cálculo copiado');window.cmTrack?.('calculation_share',{calculator_name:type,method:'copy_link'});setTimeout(()=>button.textContent=old,1600)}catch{window.cmToast?.('No se pudo copiar el enlace')}}
function ensureShare(){if(!resultCard)return;let actions=resultCard.querySelector('.result-actions');if(!actions){actions=document.createElement('div');actions.className='result-actions';resultCard.append(actions)}if(actions.querySelector('[data-copy-calc-link]'))return;const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.copyCalcLink='';b.textContent='Copiar enlace al cálculo';b.addEventListener('click',()=>copyLink(b));actions.append(b)}
function ensureStyles(){if(document.getElementById('cmParityStyles'))return;const s=document.createElement('style');s.id='cmParityStyles';s.textContent='.cm-explanation{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.18)}.cm-explanation summary{cursor:pointer;font-weight:850}.cm-explanation-body{margin-top:10px;font-size:.88rem;line-height:1.5}.cm-formula{margin:7px 0;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.08)}.cm-explanation-body ul{padding-left:20px;margin-bottom:0}';document.head.append(s)}
function refresh(){writeState();ensureExplanation();ensureShare()}
function init(){ensureStyles();const restored=restore();ensureShare();ensureExplanation();let timer;form.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(refresh,180)});form.addEventListener('change',refresh);form.addEventListener('submit',()=>setTimeout(refresh,0),true);if(restored)setTimeout(()=>{if(form.reportValidity())form.requestSubmit()},0);else writeState()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();