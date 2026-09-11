(()=>{
'use strict';
function styles(){
  if(document.getElementById('cmQualityFixStyles'))return;
  const s=document.createElement('style');s.id='cmQualityFixStyles';s.textContent=`
    .consent .btn.primary{background:#a94629!important;border-color:#a94629!important;color:#fff!important}
    .consent .btn.primary:hover{background:#8f3c24!important;border-color:#8f3c24!important}
    .product-score[data-score-band="high"]{background:#dfeee7;color:#174d3c}
    .product-score[data-score-band="good"]{background:#e1edf4;color:#244e63}
    .product-score[data-score-band="mid"]{background:#f3eadb;color:#684f2a}
    .product-score[data-score-band="low"]{background:#f1e5df;color:#704234}
    .product-score[data-score-band] span{color:inherit;opacity:.75}
    @media print{.result-actions,.workflow-actions,.consent{display:none!important}.result-card{position:static!important;break-inside:avoid;background:#fff!important;color:#111!important;border:1px solid #bbb!important}.result-sub,.metric span{color:#555!important}.metric{background:#f2f2f2!important}}
  `;document.head.appendChild(s)
}
function colorScores(){document.querySelectorAll('.product-score').forEach(score=>{const n=parseFloat(score.querySelector('b')?.textContent);if(!Number.isFinite(n))return;score.dataset.scoreBand=n>=75?'high':n>=60?'good':n>=45?'mid':'low';score.title=`Índice calidad-precio: ${Math.round(n)}/100. Cuanto más alto, mejor.`})}
function improveRoomSubmit(){const form=document.querySelector('[data-room-calculator]');if(!form||form.dataset.qualitySubmit)return;form.dataset.qualitySubmit='1';form.addEventListener('submit',()=>setTimeout(()=>{const main=document.getElementById('roomResultMain');if(!main||main.textContent.trim()==='—')return;window.cmToast?.('Cálculo de reforma actualizado');if(innerWidth<=850){const card=main.closest('.result-card');card?.scrollIntoView({behavior:'smooth',block:'start'})}},30))}
function printFeedback(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-result-action="print"]');if(!b)return;window.cmToast?.('Abriendo impresión. Para crear un PDF elige “Guardar como PDF”.')},true)}
function addPortfolioHubLink(){const footer=document.querySelector('footer');if(!footer||footer.querySelector('[data-portfolio-hub]'))return;const host=footer.querySelector('nav')||footer.querySelector('.footer-links')||footer;const a=document.createElement('a');a.href='https://elvaropablo-oss.github.io/';a.textContent='Todas las herramientas';a.dataset.portfolioHub='';a.setAttribute('aria-label','Ver todas las herramientas de la colección');host.appendChild(a)}
function init(){styles();colorScores();improveRoomSubmit();printFeedback();addPortfolioHubLink();new MutationObserver(colorScores).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();